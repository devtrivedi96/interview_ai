"""
Lightweight AWS auth compatibility wrapper.
Provides a small in-memory/Cognito placeholder API with the subset
of functions used by the app: create_user, delete_user, get_user_by_email,
generate_email_verification_link, sign_in_with_password, verify_id_token.

This is intentionally minimal: if `boto3` + Cognito are configured this
module can be extended to call Cognito. For now it supports a persistent
in-memory store and issues local JWTs for dev flows.
"""
from datetime import datetime, timedelta
import uuid
import logging
from typing import Dict, Optional

try:
    import boto3
except Exception:
    boto3 = None

from jose import jwt
from passlib.hash import sha256_crypt
from src.utils.config import settings

logger = logging.getLogger(__name__)


class EmailAlreadyExistsError(Exception):
    pass


class UserNotFoundError(Exception):
    pass


# Simple in-memory store
_USERS: Dict[str, Dict] = {}


def _make_uid() -> str:
    return uuid.uuid4().hex


def create_user(email: str, password: str, email_verified: bool = False):
    # Check for existing
    for uid, u in _USERS.items():
        if u.get("email") == email:
            raise EmailAlreadyExistsError("Email already exists")

    uid = _make_uid()
    hashed = sha256_crypt.hash(password)
    _USERS[uid] = {
        "id": uid,
        "email": email,
        "hashed_password": hashed,
        "email_verified": email_verified,
        "created_at": datetime.utcnow(),
    }

    # Return a user-like object
    return type("FUser", (), {"uid": uid})()


def delete_user(uid: str):
    _USERS.pop(uid, None)


def get_user_by_email(email: str):
    for uid, u in _USERS.items():
        if u.get("email") == email:
            return type("FUser", (), {"uid": uid, "email_verified": u.get("email_verified", False)})()
    raise UserNotFoundError("User not found")


def generate_email_verification_link(email: str, action_code_settings=None) -> str:
    # Create a simple verification token and return a link pointing to frontend
    token = uuid.uuid4().hex
    # In a real setup you'd persist this token and verify it at callback
    return f"{settings.EMAIL_VERIFICATION_REDIRECT_URL}?verify_token={token}&email={email}"


def sign_in_with_password(email: str, password: str) -> Dict:
    # Authenticate against in-memory store
    for uid, u in _USERS.items():
        if u.get("email") == email:
            if sha256_crypt.verify(password, u.get("hashed_password", "")):
                # Issue a local JWT compatible with verify_id_token
                payload = {
                    "uid": uid,
                    "email": email,
                    "email_verified": bool(u.get("email_verified", False)),
                    "exp": datetime.utcnow() + timedelta(minutes=60),
                }
                token = jwt.encode(payload, settings.SECRET_KEY, algorithm="HS256")
                return {"idToken": token, "localId": uid}
            raise ValueError("INVALID_PASSWORD")
    raise ValueError("EMAIL_NOT_FOUND")


def verify_id_token(token: str) -> Dict:
    try:
        decoded = jwt.decode(token, settings.SECRET_KEY, algorithms=["HS256"])
        return decoded
    except Exception as e:
        logger.debug(f"Failed to verify token: {e}")
        raise
