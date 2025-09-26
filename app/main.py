import sys, os
from datetime import datetime, timedelta
import jwt

from pydantic import BaseModel, EmailStr
from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session
from jose import JWTError
from app.database import get_db, engine
from app import models, schema
from app.models import User
from app.config import conf
from app.utils.security import hash_password, verify_password
from app.utils.jwt import create_access_token, decode_access_token

# Base.metadata.create_all(bind=engine)
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Easy Kitchen API")

auth_scheme = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(auth_scheme)):
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    return payload

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

# ================================================================
# Endpoints from ketan_branch
# ================================================================

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

@app.post("/login_v1", response_model=LoginResponse)  # renamed to avoid duplicate route
def login_v1(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    if not user or not verify_password(request.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Incorrect email or password.")

    expiration = datetime.now(datetime.timezone.utc) + timedelta(
        minutes=conf.access_token_expire_minutes
    )
    token = jwt.encode(
        {"sub": request.email, "exp": expiration},
        conf.jwt_secret_key,
        algorithm="HS256",
    )

    return {"access_token": token, "token_type": "bearer"}


# ================================================================
# Endpoints from main branch
# ================================================================

@app.post("/users/", response_model=schema.UserResponse)
def create_user(user: schema.UserCreate, db: Session = Depends(get_db)):
    new_user = models.User(
        username=user.username,
        email=user.email,
        password_hash=hash_password(user.password),
        role=user.role,
        status=user.status,
    )

    db.add(new_user)
    try:
        db.commit()
        db.refresh(new_user)
    except IntegrityError:
        db.rollback()
        raise HTTPException(status_code=400, detail="Username or email already registered")

    return new_user

@app.post("/login_v2")  # renamed to avoid duplicate route
def login_v2(credentials: schema.LoginRequest, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_access_token(data={"sub": str(user.id), "role": str(user.role)})
    return {"access_token": token, "token_type": "bearer"}

@app.get("/protected")
def protected_route(current_user: dict = Depends(get_current_user)):
    return {"message": "You accessed a protected route!", "user": current_user}
