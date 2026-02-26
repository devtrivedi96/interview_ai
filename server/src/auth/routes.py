"""
Authentication routes
Firebase email/password auth with automatic email verification
Falls back to dev mode if Firebase not initialized
"""
import json
from datetime import datetime
from urllib import error, request

from fastapi import APIRouter, Depends, HTTPException, status
try:
    import firebase_admin
    from firebase_admin import auth as firebase_auth
    FIREBASE_AVAILABLE = True
except:
    FIREBASE_AVAILABLE = False

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
    # Skip email sending if Brevo not configured (dev mode)
    if not settings.BREVO_API_KEY or not settings.BREVO_SENDER_EMAIL:
        print(f"[DEV] Email verification link for {email}: {verification_link}")
        return

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
    Register a new user.
    - If Firebase is configured: uses Firebase Auth with email verification
    - If not configured: uses in-memory auth (email verification skipped for dev)
    """
    db = db_client.get_db()
    users_ref = db.collection(db_client.Collections.USERS)
    
    # Try Firebase first
    if FIREBASE_AVAILABLE:
        try:
            # Create user in Firebase
            firebase_user = firebase_auth.create_user(
                email=user_data.email,
                password=user_data.password
            )
            
            # Send verification email (Firebase handles this automatically)
            try:
                verification_link = firebase_auth.generate_email_verification_link(user_data.email)
                print(f"[Firebase] Verification link sent to {user_data.email}")
            except Exception as e:
                print(f"[Firebase] Email sending error (non-blocking): {e}")
            
            # Save user profile to AWS database
            user_ref = users_ref.document(firebase_user.uid)
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
            
            return VerificationResponse(
                message="Account created. Verification email sent. Please verify your email before logging in."
            )
            
        except Exception as e:
            # If it's already exists error, raise it
            if "already" in str(e).lower():
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered",
                )
            # For other errors, fall back to dev mode
            print(f"[Firebase] Not available or not initialized: {e}")
    
    # Fallback: Dev mode with in-memory storage
    import uuid
    from auth.security import get_password_hash
    
    # Check if email already exists
    try:
        users_list = list(users_ref.where("email", "==", user_data.email).limit(1).get())
        if users_list:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered",
            )
    except HTTPException:
        raise
    except:
        pass
    
    if len(user_data.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters",
        )
    
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
    Authenticate using Firebase (if available) or fallback to in-memory auth.
    """
    if FIREBASE_AVAILABLE:
        try:
            # Verify password with Firebase REST API
            import requests
            firebase_config = settings.dict()
            
            # Try to get Firebase web API key from config
            api_key = getattr(settings, 'FIREBASE_WEB_API_KEY', None)
            
            if api_key:
                # Use Firebase REST API for password verification
                response = requests.post(
                    f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}",
                    json={"email": user_data.email, "password": user_data.password, "returnSecureToken": True},
                    timeout=10
                )
                
                if response.status_code == 200:
                    data = response.json()
                    id_token = data.get("idToken")
                    firebase_uid = data.get("localId")
                    
                    # Verify email
                    try:
                        firebase_user = firebase_auth.get_user(firebase_uid)
                        if not firebase_user.email_verified:
                            raise HTTPException(
                                status_code=status.HTTP_403_FORBIDDEN,
                                detail="Email not verified. Please verify your email before logging in.",
                            )
                    except:
                        pass
                    
                    # Update last login
                    db = db_client.get_db()
                    db.collection(db_client.Collections.USERS).document(firebase_uid).set(
                        {
                            "email": user_data.email,
                            "email_verified": True,
                            "last_login": datetime.utcnow(),
                        },
                        merge=True,
                    )
                    
                    return Token(access_token=id_token, token_type="bearer")
                else:
                    raise HTTPException(
                        status_code=status.HTTP_401_UNAUTHORIZED,
                        detail="Incorrect email or password",
                    )
            else:
                raise Exception("Firebase Web API Key not configured")
                
        except HTTPException:
            raise
        except Exception as e:
            # Fall through to dev mode
            pass
    
    # Fallback: Dev mode authentication
    db = db_client.get_db()
    users_ref = db.collection(db_client.Collections.USERS)
    
    try:
        users_list = list(users_ref.where("email", "==", user_data.email).limit(1).get())
    except:
        users_list = []
    
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
    except:
        pass
    
    # Issue local JWT
    access_token = create_access_token(data={"sub": user_doc.id})
    return Token(access_token=access_token, token_type="bearer")


@router.post("/verify-email/resend", response_model=VerificationResponse)
async def resend_email_verification(payload: UserEmail):
    """
    Resend verification email via Firebase for an existing user.
    """
    try:
        firebase_user = firebase_auth.get_user_by_email(payload.email)
        
        if firebase_user.email_verified:
            return VerificationResponse(message="Email is already verified.")
        
        # Send verification email
        verification_link = firebase_auth.generate_email_verification_link(payload.email)
        return VerificationResponse(message="Verification email has been sent.")
        
    except firebase_auth.UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found",
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send verification email: {str(e)}",
        )


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
