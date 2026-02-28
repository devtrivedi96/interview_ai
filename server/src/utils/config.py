from typing import List
from pydantic_settings import BaseSettings
from pydantic import ConfigDict


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
    STT_MAX_RETRIES: int = 2
    STT_TIMEOUT_SEC: int = 30

    # Audio Settings
    MAX_AUDIO_SIZE_MB: int = 25
    AUDIO_QUALITY_THRESHOLD: float = 0.6
    SUPPORTED_AUDIO_FORMATS: List[str] = ["wav", "mp3", "m4a", "webm"]

    # Session Settings
    DEFAULT_SESSION_DURATION_MIN: int = 30
    MIN_QUESTIONS_PER_SESSION: int = 3
    MAX_QUESTIONS_PER_SESSION: int = 10

    # Evaluation
    MIN_EVAL_CONFIDENCE: float = 0.5
    EVALUATION_TIMEOUT_SEC: int = 10

    # Privacy & Retention
    AUDIO_RETENTION_DAYS: int = 30
    TRANSCRIPT_RETENTION_DAYS: int = 90
    REQUIRE_AUDIO_CONSENT: bool = True

    # Performance Targets
    TARGET_EVAL_LATENCY_P95_SEC: float = 10.0
    TARGET_STT_LATENCY_P95_SEC: float = 5.0

    # Analytics
    ENABLE_ANALYTICS: bool = True
    LOG_LEVEL: str = "INFO"

    # Email (Brevo)
    BREVO_API_KEY: str = ""
    BREVO_SENDER_EMAIL: str = ""
    BREVO_SENDER_NAME: str = "Interview AI"
    EMAIL_VERIFICATION_REDIRECT_URL: str = "http://localhost:5173/login"

    model_config = ConfigDict(env_file=".env")


settings = Settings()
