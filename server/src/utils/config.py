from pathlib import Path
from typing import List

from pydantic import ConfigDict, field_validator
from pydantic_settings import BaseSettings


BASE_DIR = Path(__file__).resolve().parents[2]
ENV_FILE = BASE_DIR / ".env"


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Interview AI"
    DEBUG: bool = True
    ENVIRONMENT: str = "development"

    # Firebase
    FIREBASE_PROJECT_ID: str = ""
    FIREBASE_CREDENTIALS_PATH: str = "firebase-credentials.json"
    FIREBASE_API_KEY: str = ""
    FIREBASE_AUTH_DOMAIN: str = ""
    FIREBASE_STORAGE_BUCKET: str = ""
    FIREBASE_MESSAGING_SENDER_ID: str = ""
    FIREBASE_APP_ID: str = ""
    FIREBASE_MEASUREMENT_ID: str = ""

    # AWS (optional in current Firebase path)
    AWS_REGION: str = "us-east-1"
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_SESSION_TOKEN: str = ""
    COGNITO_USER_POOL_ID: str = ""
    COGNITO_CLIENT_ID: str = ""

    # Security
    SECRET_KEY: str = "your-secret-key-change-in-production-use-openssl-rand-hex-32"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7

    # CORS
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]

    # LLM Provider (default to AWS Bedrock to match current infra)
    AI_PROVIDER: str = "aws_bedrock"  # aws_bedrock | openai | groq
    OPENAI_API_KEY: str = ""
    AI_MODEL: str = "gpt-4"
    AI_TEMPERATURE: float = 0.3
    AI_MAX_RETRIES: int = 2
    AI_TIMEOUT_SEC: int = 30

    # Additional LLM providers for fallback
    GROQ_API_KEY: str = ""
    GEMINI_API_KEY: str = ""
    # Default Groq chat model; can be overridden via env GROQ_MODEL
    GROQ_MODEL: str = "llama-3.1-8b-instant"
    # Default Gemini chat model; can be overridden via env GEMINI_MODEL
    GEMINI_MODEL: str = "gemini-1.5-flash"

    # OpenAI embeddings model (for future use in vector search etc.)
    OPENAI_EMBEDDING_MODEL: str = "text-embedding-3-small"

    # AWS Bedrock (defaults tuned to Claude 3 Haiku in us-east-1)
    AWS_BEDROCK_REGION: str = "us-east-1"
    AWS_BEDROCK_MODEL_ID: str = "anthropic.claude-3-haiku-20240307-v1:0"
    AWS_BEDROCK_MAX_TOKENS: int = 1000
    AWS_BEARER_TOKEN_BEDROCK: str = ""

    # STT
    STT_PROVIDER: str = "openai"
    STT_MODEL: str = "whisper-1"
    STT_MAX_RETRIES: int = 2
    STT_TIMEOUT_SEC: int = 30
    STT_AWS_LANGUAGE_CODE: str = "en-US"
    STT_AWS_JOB_TIMEOUT_SEC: int = 180
    STT_AWS_POLL_INTERVAL_SEC: int = 3
    
    # Whisper Local Model (for offline STT)
    WHISPER_MODEL_SIZE: str = "base"  # tiny, base, small, medium, large
    WHISPER_DEVICE: str = "cpu"  # cpu or cuda for GPU

    # AWS Transcribe
    AWS_TRANSCRIBE_S3_BUCKET: str = ""
    AWS_TRANSCRIBE_S3_PREFIX: str = "stt-input"
    AWS_TRANSCRIBE_S3_REGION: str = ""

    # Audio Settings
    MAX_AUDIO_SIZE_MB: int = 25
    AUDIO_QUALITY_THRESHOLD: float = 0.6
    SUPPORTED_AUDIO_FORMATS: List[str] = ["wav", "mp3", "m4a", "webm"]

    # Session Settings
    DEFAULT_SESSION_DURATION_MIN: int = 30
    MIN_QUESTIONS_PER_SESSION: int = 3
    MAX_QUESTIONS_PER_SESSION: int = 50

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

    # Email
    BREVO_API_KEY: str = ""
    BREVO_SENDER_EMAIL: str = ""
    BREVO_SENDER_NAME: str = "Interview AI"
    EMAIL_VERIFICATION_REDIRECT_URL: str = "http://localhost:5173/login"

    @field_validator("DEBUG", mode="before")
    @classmethod
    def _normalize_debug(cls, v):
        if isinstance(v, str):
            normalized = v.strip().lower()
            if normalized in {"release", "prod", "production", "0", "false", "no", "off"}:
                return False
            if normalized in {"dev", "development", "1", "true", "yes", "on"}:
                return True
        return v

    model_config = ConfigDict(
        env_file=str(ENV_FILE),
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
