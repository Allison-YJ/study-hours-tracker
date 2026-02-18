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
                for user in cur.fetchall():
                    uid = user['id']
                    cur.execute("SELECT SUM(duration_minutes) as tot, COUNT(id) as cnt, MIN(duration_minutes) as low, MAX(duration_minutes) as high, COUNT(DISTINCT study_date) as days FROM study_sessions WHERE user_id = %s", (uid,))
                    s = cur.fetchone()
                    
                    if not s['cnt']: continue

                    cur.execute("SELECT subject, SUM(duration_minutes) as minutes FROM study_sessions WHERE user_id = %s GROUP BY subject", (uid,))
                    breakdown = cur.fetchall()

                    doc = {
                        "user_id": uid, "username": user['username'],
                        "metrics": {
                            "total_minutes": int(s['tot'] or 0), "session_count": int(s['cnt'] or 0),
                            "min_session": int(s['low'] or 0), "max_session": int(s['high'] or 0),
                            "avg_minutes_per_day": float(s['tot']/s['days'] if s['days'] else 0)
                        },
                        "subject_breakdown": breakdown,
                        "last_updated": datetime.utcnow()
                    }
                    mongo_col.update_one({"user_id": uid}, {"$set": doc}, upsert=True)
            sql_conn.close()
            print("Analytics updated.")
        except Exception as e: print(f"Error: {e}")
        time.sleep(10)

if __name__ == "__main__":
    time.sleep(10)
    run_worker()