import os, time, pymysql, pymongo
from datetime import datetime

def run_worker():
    while True:
        try:
            sql_conn = pymysql.connect(
                host=os.getenv("MYSQL_HOST"), user=os.getenv("MYSQL_USER"),
                password=os.getenv("MYSQL_PASSWORD"), database=os.getenv("MYSQL_DB"),
                cursorclass=pymysql.cursors.DictCursor
            )
            mongo_col = pymongo.MongoClient(os.getenv("MONGO_URI")).get_database().analytics

            with sql_conn.cursor() as cur:
                cur.execute("SELECT id, username FROM users")
                users = cur.fetchall()
                
                for user in users:
                    uid = user['id']
                    
                    # 1. Overall Statistics
                    cur.execute("""
                        SELECT 
                            SUM(duration_minutes) as tot, 
                            COUNT(id) as cnt, 
                            MIN(duration_minutes) as low, 
                            MAX(duration_minutes) as high 
                        FROM study_sessions 
                        WHERE user_id = %s
                    """, (uid,))
                    overall = cur.fetchone()
                    
                    if not overall or not overall['cnt']:
                        continue

                    # 2. Per-Subject Statistics
                    cur.execute("""
                        SELECT 
                            subject, 
                            SUM(duration_minutes) as total_minutes, 
                            AVG(duration_minutes) as average_minutes, 
                            MAX(duration_minutes) as max_session, 
                            MIN(duration_minutes) as min_session, 
                            COUNT(*) as session_count 
                        FROM study_sessions 
                        WHERE user_id = %s 
                        GROUP BY subject
                    """, (uid,))
                    subjects = cur.fetchall()

                    # 3. Construct MongoDB Document
                    doc = {
                        "user_id": uid,
                        "username": user['username'],
                        "total_minutes": int(overall['tot'] or 0),
                        "total_sessions": int(overall['cnt'] or 0),
                        "max_session": int(overall['high'] or 0),
                        "min_session": int(overall['low'] or 0),
                        "subject_stats": [
                            {
                                "subject": s['subject'],
                                "total_minutes": int(s['total_minutes']),
                                "average_minutes": float(s['average_minutes']),
                                "max_session": int(s['max_session']),
                                "min_session": int(s['min_session']),
                                "session_count": int(s['session_count'])
                            } for s in subjects
                        ],
                        "last_updated": datetime.utcnow()
                    }
                    
                    mongo_col.update_one({"user_id": uid}, {"$set": doc}, upsert=True)
            
            sql_conn.close()
            print(f"[{datetime.now()}] Analytics pre-computed for active users.")
        except Exception as e:
            print(f"Worker Error: {e}")
        
        time.sleep(10)

if __name__ == "__main__":
    # Wait for DBs to be ready
    time.sleep(10)
    print("Analytics Worker Started...")
    run_worker()
