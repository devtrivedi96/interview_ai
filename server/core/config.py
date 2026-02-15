"""
Configuration management
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # App
    APP_NAME: str = "Interview Prep Buddy"
    DEBUG: bool = True
    
    # Firebase
    FIREBASE_CREDENTIALS_PATH: str = "firebase-credentials.json"
    
    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000"]
    
    # AI Provider
    OPENAI_API_KEY: str = ""
    AI_MODEL: str = "gpt-4"
    AI_MAX_RETRIES: int = 2
    
    # Speech-to-Text
    STT_PROVIDER: str = "openai"  # openai whisper
    STT_MAX_RETRIES: int = 2
    
    # Performance
    MAX_AUDIO_SIZE_MB: int = 25
    EVALUATION_TIMEOUT_SEC: int = 10
    
    class Config:
        env_file = ".env"


settings = Settings()
