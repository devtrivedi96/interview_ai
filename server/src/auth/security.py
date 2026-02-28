"""
Security utilities
Firebase token validation and authenticated user resolution
"""
from datetime import datetime
from typing import Optional

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from firebase_admin import auth as firebase_auth

from src.db.firebase_client import get_db, Collections
from src.db.models import User

security = HTTPBearer()


async def get_current_user_firebase(
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """
    Dependency to get current authenticated user.
    
    Validates Firebase ID token and retrieves user profile from Firestore.
    If user document doesn't exist, creates it on first login.
    """
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        token = credentials.credentials
        
        # Verify Firebase ID token
        decoded_token = firebase_auth.verify_id_token(token)
        user_id = decoded_token.get("uid")
        
        if user_id is None:
            raise credentials_exception
            
    except HTTPException:
        raise
    except Exception:
        raise credentials_exception
    
    # Get or create user in Firestore
    db = get_db()
    user_ref = db.collection(Collections.USERS).document(user_id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        # Create user document on first login
        email = decoded_token.get("email", "")
        email_verified = bool(decoded_token.get("email_verified", False))
        now = datetime.utcnow()
        
        user_ref.set({
            "email": email,
            "email_verified": email_verified,
            "audio_consent": False,
            "created_at": now,
            "last_login": now,
            "profile": {},
        })
        user_doc = user_ref.get()
    
    user_data = user_doc.to_dict() or {}
    
    # Sync email verification status from Firebase token
    token_email_verified = bool(decoded_token.get("email_verified", False))
    if user_data.get("email_verified") != token_email_verified:
        user_ref.update({"email_verified": token_email_verified})
        user_data["email_verified"] = token_email_verified
    
    try:
        return User.from_dict(user_doc.id, user_data)
    except Exception:
        raise credentials_exception


def require_audio_consent(current_user: User = Depends(get_current_user_firebase)) -> User:
    """
    Dependency to ensure user has given audio consent.
    Required for recording audio during interviews.
    """
    if not current_user.audio_consent:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Audio recording consent required. Please update your consent settings.",
        )
    return current_user
