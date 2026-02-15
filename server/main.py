"""
Interview Prep Buddy - Main FastAPI Application
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from api.routes import auth, sessions, users
from core.config import settings
from db.firebase import init_firebase


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize Firebase on startup"""
    init_firebase()
    yield


app = FastAPI(
    title="Interview Prep Buddy API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/v1/auth", tags=["auth"])
app.include_router(sessions.router, prefix="/api/v1/sessions", tags=["sessions"])
app.include_router(users.router, prefix="/api/v1/users", tags=["users"])


@app.get("/health")
async def health_check():
    return {"status": "healthy"}
