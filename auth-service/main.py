import os, jwt, datetime, pymysql
from fastapi import FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from passlib.context import CryptContext
from pydantic import BaseModel

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"])

SECRET = os.getenv("JWT_SECRET", "secret")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class User(BaseModel):
    username: str
    password: str

def db_query(sql, params=()):
    conn = pymysql.connect(
        host=os.getenv("MYSQL_HOST"), user=os.getenv("MYSQL_USER"),
        password=os.getenv("MYSQL_PASSWORD"), database=os.getenv("MYSQL_DB"),
        cursorclass=pymysql.cursors.DictCursor
    )
    with conn:
        with conn.cursor() as cur:
            cur.execute(sql, params)
            return cur.fetchone()

@app.post("/auth/login")
def login(u: User):
    row = db_query("SELECT * FROM users WHERE username = %s", (u.username,))
    if not row or not pwd_context.verify(u.password, row["password_hash"]):
        raise HTTPException(401, "Invalid user or password")
    
    token = jwt.encode({
        "user_id": row["id"], "username": row["username"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=24)
    }, SECRET)
    return {"access_token": token}

@app.get("/auth/verify")
def verify(authorization: str = Header(None)):
    if not authorization: raise HTTPException(401)
    try:
        token = authorization.split(" ")[1]
        payload = jwt.decode(token, SECRET, algorithms=["HS256"])
        return payload
    except: raise HTTPException(401, "Invalid token")