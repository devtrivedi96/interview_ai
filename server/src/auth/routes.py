"""
Authentication routes
Firebase email/password auth with Brevo-based email verification
"""
import json
from datetime import datetime
from urllib import error, request

from fastapi import APIRouter, Depends, HTTPException, status
from auth import aws_auth as aws_auth
from pydantic import BaseModel, EmailStr

from auth.security import get_current_user
from db import aws_client as db_client
from db.models import User
from utils.config import settings

router = APIRouter()


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    audio_consent: bool = False


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserEmail(BaseModel):
    email: EmailStr


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserResponse(BaseModel):
    id: str
    email: str
    email_verified: bool
    audio_consent: bool
    created_at: datetime


class VerificationResponse(BaseModel):
    message: str


def _send_brevo_verification_email(email: str, verification_link: str) -> None:
    if not settings.BREVO_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Brevo API key is not configured",
        )
    if not settings.BREVO_SENDER_EMAIL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Brevo sender email is not configured",
        )

    payload = {
        "sender": {
            "name": settings.BREVO_SENDER_NAME,
            "email": settings.BREVO_SENDER_EMAIL,
        },
        "to": [{"email": email}],
        "subject": "Verify your email for Interview AI",
        "htmlContent": (
            "<p>Thanks for signing up for Interview AI.</p>"
            "<p>Please verify your email by clicking the link below:</p>"
            f"<p><a href=\"{verification_link}\">Verify Email</a></p>"
            "<p>If you did not create this account, you can ignore this email.</p>"
        ),
        "textContent": (
            "Thanks for signing up for Interview AI.\n"
            "Please verify your email using the link below:\n"
            f"{verification_link}\n\n"
            "If you did not create this account, you can ignore this email."
        ),
    }

    req = request.Request(
        "https://api.brevo.com/v3/smtp/email",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "accept": "application/json",
            "api-key": settings.BREVO_API_KEY,
            "content-type": "application/json",
        },
        method="POST",
    )

    try:
        request.urlopen(req, timeout=15).read()
    except error.HTTPError as e:
        detail = e.read().decode("utf-8", errors="ignore")
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=f"Failed to send verification email via Brevo: {detail}",
        )
    except error.URLError:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to connect to Brevo API",
        )


def _generate_and_send_verification_email(email: str) -> None:
    db_client.get_db()  # ensure DB client init
    try:
        verification_link = aws_auth.generate_email_verification_link(email)
        _send_brevo_verification_email(email, verification_link)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to generate verification link: {str(e)}",
        )


def _aws_sign_in(email: str, password: str) -> dict:
    try:
        return aws_auth.sign_in_with_password(email, password)
    except ValueError as e:
        raw = str(e)
        msg = "Incorrect email or password"
        if "EMAIL_NOT_FOUND" in raw or "INVALID_PASSWORD" in raw:
            msg = "Incorrect email or password"
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=msg)
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail="Failed to connect to auth service",
        )


@router.post(
    "/register", response_model=VerificationResponse, status_code=status.HTTP_201_CREATED
)
async def register(user_data: UserRegister):
    """
    Register a new user in Cognito/local auth, create profile in DB,
    and send a verification email via Brevo.
    """
    # Ensure DB client is initialized (or fallback in-memory DB)
    db = db_client.get_db()
    users_ref = db.collection(db_client.Collections.USERS)

    # If AWS/Dynamo is available, create a user and send verification
    if db_client.AWS_AVAILABLE:
        try:
            aws_user = aws_auth.create_user(
                email=user_data.email, password=user_data.password, email_verified=False
            )
        except aws_auth.EmailAlreadyExistsError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create user: {str(e)}",
            )

        user_ref = users_ref.document(aws_user.uid)
        user_ref.set(
            {
                "email": user_data.email,
                "email_verified": False,
                "audio_consent": user_data.audio_consent,
                "created_at": datetime.utcnow(),
                "last_login": None,
                "profile": {},
            }
        )

        try:
            _generate_and_send_verification_email(user_data.email)
        except Exception:
            # Roll back partially created user if verification email could not be sent.
            try:
                user_ref.delete()
            except Exception:
                pass
            try:
                aws_auth.delete_user(aws_user.uid)
            except Exception:
                pass
            raise

        return VerificationResponse(
            message="Account created. Please verify your email before logging in."
        )

    # Dev fallback: create a local user record with hashed password so login works without Firebase
    import uuid
    from auth.security import get_password_hash

    local_uid = uuid.uuid4().hex
    user_ref = users_ref.document(local_uid)
    user_ref.set(
        {
            "email": user_data.email,
            "email_verified": True,
            "audio_consent": user_data.audio_consent,
            "created_at": datetime.utcnow(),
            "last_login": None,
            "profile": {},
            "hashed_password": get_password_hash(user_data.password),
        }
    )

    return VerificationResponse(message="Account created (dev mode). You may log in immediately.")


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    """
    Authenticate using hosted auth (Cognito) or local email/password and return ID token.
    Blocks login until email is verified.
    """
    # If AWS client is available use its auth service
    if db_client.AWS_AVAILABLE:
        sign_in_data = _aws_sign_in(user_data.email, user_data.password)
        id_token = sign_in_data.get("idToken")
        uid = sign_in_data.get("localId")

        if not id_token or not uid:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to authenticate with auth provider",
            )

        db_client.get_db()  # ensure DB init
        try:
            decoded_token = aws_auth.verify_id_token(id_token)
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Failed to validate token",
            )

        email_verified = bool(decoded_token.get("email_verified", False))
        if not email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Email not verified. Please verify your email before logging in.",
            )

        db = db_client.get_db()
        db.collection(db_client.Collections.USERS).document(uid).set(
            {
                "email": user_data.email,
                "email_verified": True,
                "last_login": datetime.utcnow(),
            },
            merge=True,
        )

        return Token(access_token=id_token, token_type="bearer")

    # Dev fallback: authenticate against in-memory DB client and return local JWT
    db = db_client.get_db()
    users_ref = db.collection(db_client.Collections.USERS)
    users = users_ref.where("email", "==", user_data.email).limit(1).get()
    users_list = list(users)

    if not users_list:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    user_doc = users_list[0]
    user_dict = user_doc.to_dict()

    from auth.security import verify_password, create_access_token

    if not verify_password(user_data.password, user_dict.get("hashed_password", "")):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # Update last login
    try:
        users_ref.document(user_doc.id).update({"last_login": datetime.utcnow()})
    except Exception:
        pass

    # Issue local JWT
    access_token = create_access_token(data={"sub": user_doc.id})
    return Token(access_token=access_token, token_type="bearer")


@router.post("/verify-email/resend", response_model=VerificationResponse)
async def resend_email_verification(payload: UserEmail):
    """
    Resend verification email via Brevo for an existing Firebase user.
    """
    db_client.get_db()  # ensure DB init
    try:
        user = aws_auth.get_user_by_email(payload.email)
    except aws_auth.UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )

    if user.email_verified:
        return VerificationResponse(message="Email is already verified.")

    _generate_and_send_verification_email(payload.email)
    return VerificationResponse(message="Verification email has been sent.")


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
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
    consent: bool, current_user: User = Depends(get_current_user)
):
    """Update user's audio recording consent."""
    db = db_client.get_db()
    db.collection(db_client.Collections.USERS).document(current_user.id).update(
        {"audio_consent": consent}
    )

    return {"audio_consent": consent, "message": "Consent updated successfully"}
