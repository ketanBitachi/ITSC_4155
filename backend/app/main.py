# from fastapi import FastAPI
# from fastapi.middleware.cors import CORSMiddleware
# from .database import engine, Base
# from .routers import auth_router, pantry_router

# # Create database tables
# Base.metadata.create_all(bind=engine)

# # Create FastAPI app
# app = FastAPI(
#     title="Easy Kitchen API",
#     description="API for Easy Kitchen meal planning application",
#     version="1.0.0"
# )

# # Configure CORS
# app.add_middleware(
#     CORSMiddleware,
#     allow_origins=["*"],  # In production, replace with specific origins
#     allow_credentials=True,
#     allow_methods=["*"],
#     allow_headers=["*"],
# )

# # Include routers
# app.include_router(auth_router)
# app.include_router(pantry_router)

# @app.get("/")
# def read_root():
#     return {"message": "Welcome to Easy Kitchen API"}

# @app.get("/health")
# def health_check():
#     return {"status": "healthy"}

# new.env
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, test_connection
from .routers import auth_router, pantry_router
from .config import settings

# Create database tables
print("Creating database tables...")
Base.metadata.create_all(bind=engine)
print("✅ Database tables created successfully!")

# Test database connection
print("\nTesting database connection...")
test_connection()

# Create FastAPI app
app = FastAPI(
    title="Easy Kitchen API",
    description="API for Easy Kitchen meal planning application",
    version="1.0.0"
)

# Configure CORS - allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins like ["http://localhost:3000"]
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(pantry_router)

@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "message": "Welcome to Easy Kitchen API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected"
    }

@app.get("/config")
def get_config():
    """Get configuration info (for debugging - remove in production)"""
    return {
        "db_host": settings.DB_HOST,
        "db_name": settings.DB_NAME,
        "db_port": settings.DB_PORT,
        "use_supabase": settings.USE_SUPABASE
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    print("\n" + "="*50)
    print(" Easy Kitchen API is starting up...")
    print("="*50)
    print(f" Database: {settings.DB_NAME}@{settings.DB_HOST}:{settings.DB_PORT}")
    print(f" Auth: JWT with {settings.ACCESS_TOKEN_EXPIRE_MINUTES} min expiry")
    print(f" Documentation: http://localhost:8000/docs")
    print("="*50 + "\n")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    print("\n Easy Kitchen API is shutting down...")