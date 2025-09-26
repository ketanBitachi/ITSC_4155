import sys, os

from ITSC_4155.app.security import hash_password
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from app.database import get_db, Base, engine
from sqlalchemy import text
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import jwt
from app.config import conf
from app.models import User
from app.security import hash_password, verify_password, create_access_token

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


########## ketan's task #########

# ===== Registration (Task #22) =====
class RegisterRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterResponse(BaseModel):
    message: str

@app.post("/register", response_model=RegisterResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    # Duplicate email check
    existing = db.query(User).filter(User.email == payload.email).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered.")

    user = User(email=payload.email, password_hash=hash_password(payload.password))
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "User created successfully."}

# Request model for login
class LoginRequest(BaseModel):
    email: str
    password: str

# Response model for login
class LoginResponse(BaseModel):
    access_token: str
    token_type: str

@app.post("/login", response_model=LoginResponse)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    # Mock user validation (replace with database query)
    # if request.email != "student1@uncc.edu" or request.password != "SecurePass123":
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    # Generate JWT token
    expiration = datetime.now(datetime.timezone.utc) + timedelta(minutes=conf.access_token_expire_minutes)
    token = jwt.encode({"sub": request.email, "exp": expiration}, conf.jwt_secret_key, algorithm="HS256")

    return {"access_token": token, "token_type": "bearer"}

