from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base, test_connection
from .routers import auth_router, pantry_router
from .routers import grocery_list  # import grocery list router
from .routers import support_router, support_alias_router, preferences_router, recipes_router, favorites
from .config import settings

# Create FastAPI app
app = FastAPI(
    title="Easy Kitchen API",
    description="API for Easy Kitchen meal planning application",
    version="1.0.0"
)

origins = [
    "http://localhost:5500",
    "http://127.0.0.1:5500",
    "http://localhost:5000",
    "http://127.0.0.1:5000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+$",  # allow any localhost dev port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router)
app.include_router(pantry_router)
app.include_router(grocery_list.router)
app.include_router(support_router)
app.include_router(support_alias_router)
app.include_router(preferences_router)
app.include_router(recipes_router)
app.include_router(favorites.router)


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
    ok = test_connection()
    return {
        "status": "healthy" if ok else "unhealthy",
        "database": "connected" if ok else "error"
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
    # Create tables and test connection at startup (not at import time)
    try:
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables created successfully!")
    except Exception as e:
        print(f"⚠️ Could not create tables: {e}")

    print("\nTesting database connection...")
    test_connection()

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    print("\n Easy Kitchen API is shutting down...")