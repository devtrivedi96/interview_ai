"""
Security utilities
Token validation and authenticated user resolution (Cognito/local)
"""
from datetime import datetime
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from auth import aws_auth as aws_auth
from db.aws_client import Collections, get_db
from db.models import User
from passlib.hash import sha256_crypt
from datetime import timedelta
from jose import jwt
from utils.config import settings

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    Dependency to get current authenticated user.
    Validates Firebase ID token and retrieves the user profile from Firestore.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials

    try:
        # Ensures DB is initialized before auth calls.
        get_db()
        decoded_token = aws_auth.verify_id_token(token)
        user_id: Optional[str] = decoded_token.get("uid")
        if not user_id:
            raise credentials_exception
    except Exception:
        raise credentials_exception

    db = get_db()
    user_ref = db.collection(Collections.USERS).document(user_id)
    user_doc = user_ref.get()

    if not user_doc.exists:
        email = decoded_token.get("email")
        if not email:
            raise credentials_exception

        now = datetime.utcnow()
        user_ref.set(
            {
                "email": email,
                "email_verified": bool(decoded_token.get("email_verified", False)),
                "audio_consent": False,
                "created_at": now,
                "last_login": now,
                "profile": {},
            }
        )
        user_doc = user_ref.get()

    user_data = user_doc.to_dict()
    token_email_verified = bool(decoded_token.get("email_verified", False))

    if user_data.get("email_verified") != token_email_verified:
        user_ref.update({"email_verified": token_email_verified})
        user_data["email_verified"] = token_email_verified

    return User.from_dict(user_doc.id, user_data)


def require_audio_consent(current_user: User = Depends(get_current_user)) -> User:
    """
    Dependency to ensure user has given audio consent.
    Required for recording audio.
    """
    if not current_user.audio_consent:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Audio recording consent required. Please update your consent settings.",
        )
    return current_user


def get_password_hash(password: str) -> str:
    return sha256_crypt.hash(password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return sha256_crypt.verify(plain_password, hashed_password)
    except Exception:
        return False


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt
