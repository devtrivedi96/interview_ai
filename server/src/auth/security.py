"""
Security utilities
Frontend-provided user identity resolution (no backend token verification or Firestore)
"""
from datetime import datetime

from fastapi import Depends, Header, HTTPException, status

from src.db.aws_client import get_db, Collections
from src.db.models import User
from src.utils.config import settings

_AUDIO_CONSENT_BY_USER: dict[str, bool] = {}


def set_audio_consent_for_user(user_id: str, consent: bool) -> None:
    _AUDIO_CONSENT_BY_USER[user_id] = consent


async def get_current_user_firebase(
    x_user_id: str | None = Header(default=None, alias="X-User-Id"),
    x_user_email: str | None = Header(default=None, alias="X-User-Email"),
) -> User:
    """
    Resolve user identity from frontend headers.
    This bypasses backend token verification (dev-only/insecure mode).
    """
    user_id = x_user_id or "local-dev-user"
    email = x_user_email or "local-dev@example.com"
    now = datetime.utcnow()
    audio_consent = _AUDIO_CONSENT_BY_USER.get(user_id)

    # Recover consent from persisted user profile when process memory is cold (e.g., restart).
    if audio_consent is None:
        try:
            db = get_db()
            user_doc = db.collection(Collections.USERS).document(user_id).get()
            if user_doc.exists:
                user_data = user_doc.to_dict() or {}
                audio_consent = bool(user_data.get("audio_consent", False))
            else:
                audio_consent = False
        except Exception:
            audio_consent = False

        _AUDIO_CONSENT_BY_USER[user_id] = audio_consent

    return User(
        id=user_id,
        email=email,
        email_verified=True,
        audio_consent=audio_consent,
        created_at=now,
        last_login=now,
        profile={},
    )


def require_audio_consent(
    current_user: User = Depends(get_current_user_firebase),
) -> User:
    """Dependency to ensure user has given audio consent."""
    if not settings.REQUIRE_AUDIO_CONSENT:
        return current_user

    if not current_user.audio_consent:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Audio recording consent required. Please update your consent settings.",
        )
    return current_user
