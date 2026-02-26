from typing import List
from pydantic_settings import BaseSettings
from pydantic import AnyHttpUrl


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Interview AI"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # Firebase
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_CREDENTIALS_PATH: str = "firebase-credentials.json"
    GOOGLE_APPLICATION_CREDENTIALS: str = ""  # Path to service account JSON

    # AWS (Legacy - can be removed if not using AWS)
    AWS_REGION: str = "us-east-1"
    COGNITO_USER_POOL_ID: str = ""
    COGNITO_CLIENT_ID: str = ""

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # OpenAI
    OPENAI_API_KEY: str = ""
    AI_MODEL: str = "gpt-4"
    AI_TEMPERATURE: float = 0.3
    AI_MAX_RETRIES: int = 2
    AI_TIMEOUT_SEC: int = 30

    # STT
    STT_PROVIDER: str = "openai"
    STT_MODEL: str = "whisper-1"

    # Evaluation
    MIN_EVAL_CONFIDENCE: float = 0.5

    # Email (Brevo)
    BREVO_API_KEY: str = ""
    BREVO_SENDER_EMAIL: str = ""
    BREVO_SENDER_NAME: str = "Interview AI"
    EMAIL_VERIFICATION_REDIRECT_URL: AnyHttpUrl = "http://localhost:5173/login"

    class Config:
        env_file = ".env"


settings = Settings()
