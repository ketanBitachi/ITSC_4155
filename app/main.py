import sys, os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import get_db, Base, engine
from sqlalchemy import text

# Only create tables when not testing
if os.getenv("TESTING") != "true":
    Base.metadata.create_all(bind=engine)

app = FastAPI(title="Easy Kitchen API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def root():
    return {"message": "Hello, Easy Kitchen!"}

@app.get("/health")
def health():
    return {"status": "ok"}

@app.get("/db-test")
def db_test(db: Session = Depends(get_db)):
    result = db.execute(text("SELECT DATABASE();")).fetchone()
    return {"connected_to": result[0]}
