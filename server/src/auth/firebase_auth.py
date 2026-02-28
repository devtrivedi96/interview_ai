"""
Firebase Authentication helper functions
"""
import os
import logging
from typing import Optional, Dict

import firebase_admin
from firebase_admin import auth as firebase_auth_module, credentials

from src.utils.config import settings

logger = logging.getLogger(__name__)


class EmailAlreadyExistsError(Exception):
    pass


class UserNotFoundError(Exception):
    pass


class InvalidTokenError(Exception):
    pass


_firebase_initialized = False


def initialize_firebase():
    """Initialize Firebase Admin SDK."""
    global _firebase_initialized

    if _firebase_initialized:
        return

    try:
        if firebase_admin._apps:
            _firebase_initialized = True
            return

        cred_path = settings.FIREBASE_CREDENTIALS_PATH or os.getenv(
            "FIREBASE_CREDENTIALS_PATH", "firebase-credentials.json"
        )

        if cred_path and os.path.exists(cred_path):
            cred = credentials.Certificate(cred_path)
            firebase_admin.initialize_app(cred)
            logger.info("Firebase Admin SDK initialized with service account")
        else:
            # Fallback: initialize with explicit project id so ID token verification
            # can work even when service account JSON is not on disk.
            options = {"projectId": settings.FIREBASE_PROJECT_ID} if settings.FIREBASE_PROJECT_ID else None
            firebase_admin.initialize_app(options=options)
            logger.info("Firebase Admin SDK initialized without service account")

        _firebase_initialized = True
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
        raise Exception(f"Firebase initialization failed: {e}")


def create_user(email: str, password: str, email_verified: bool = False) -> Dict:
    if not _firebase_initialized:
        initialize_firebase()
    try:
        user = firebase_auth_module.create_user(
            email=email,
            password=password,
            email_verified=email_verified,
            disabled=False,
        )
        return {"uid": user.uid, "email": user.email, "email_verified": user.email_verified}
    except firebase_auth_module.EmailAlreadyExistsError:
        raise EmailAlreadyExistsError("Email already exists")


def get_user_by_email(email: str) -> Dict:
    if not _firebase_initialized:
        initialize_firebase()
    try:
        user = firebase_auth_module.get_user_by_email(email)
        return {"uid": user.uid, "email": user.email, "email_verified": user.email_verified}
    except firebase_auth_module.UserNotFoundError:
        raise UserNotFoundError("User not found")


def generate_email_verification_link(email: str, continue_url: Optional[str] = None) -> str:
    if not _firebase_initialized:
        initialize_firebase()

    action_code_settings = None
    if continue_url:
        action_code_settings = firebase_auth_module.ActionCodeSettings(url=continue_url)

    return firebase_auth_module.generate_email_verification_link(
        email, action_code_settings=action_code_settings
    )


def create_custom_token(uid: str) -> str:
    if not _firebase_initialized:
        initialize_firebase()

    token = firebase_auth_module.create_custom_token(uid)
    return token.decode("utf-8") if isinstance(token, bytes) else str(token)


def verify_id_token(id_token: str) -> Dict:
    if not _firebase_initialized:
        initialize_firebase()

    try:
        return firebase_auth_module.verify_id_token(id_token)
    except firebase_auth_module.InvalidIdTokenError:
        raise InvalidTokenError("Invalid authentication token")
    except firebase_auth_module.ExpiredIdTokenError:
        raise InvalidTokenError("Authentication token expired")
    except Exception as e:
        raise InvalidTokenError(str(e))
