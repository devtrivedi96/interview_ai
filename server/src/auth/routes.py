"""
Authentication routes.
Frontend handles register/login; backend exposes authenticated profile APIs.
"""
from datetime import datetime
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from src.auth.security import get_current_user_firebase, set_audio_consent_for_user
from src.db.aws_client import get_db, Collections
from src.db.models import User

router = APIRouter()


class UserResponse(BaseModel):
    id: str
    email: str
    email_verified: bool
    audio_consent: bool
    created_at: datetime


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user_firebase)):
    """Get current user profile."""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        email_verified=current_user.email_verified,
        audio_consent=current_user.audio_consent,
        created_at=current_user.created_at,
    )


@router.post("/consent/audio")
async def update_audio_consent(
    consent: bool, current_user: User = Depends(get_current_user_firebase)
):
    """Update user's audio recording consent."""
    set_audio_consent_for_user(current_user.id, consent)
    db = get_db()
    db.collection(Collections.USERS).document(current_user.id).set(
        {
            "email": current_user.email,
            "email_verified": current_user.email_verified,
            "audio_consent": bool(consent),
            "updated_at": datetime.utcnow(),
        },
        merge=True,
    )

    return {"audio_consent": consent, "message": "Consent updated successfully"}
