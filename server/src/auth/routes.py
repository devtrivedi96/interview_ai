"""
Authentication routes - Firebase only implementation
Handles user registration, email verification, and login via Firebase Auth
"""
from datetime import datetime
from typing import Optional
import logging

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from src.auth import firebase_auth
from src.auth.security import get_current_user_firebase
from src.db.firebase_client import get_db, Collections
from src.db.models import User
from src.utils.config import settings

logger = logging.getLogger(__name__)

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





@router.post(
    "/register", response_model=VerificationResponse, status_code=status.HTTP_201_CREATED
)
async def register(user_data: UserRegister):
    """
    Register a new user with Firebase Authentication or mock auth.
    
    Steps:
    1. Create Firebase Auth user (or mock user)
    2. Firebase sends verification email automatically (skipped for mock auth)
    3. Create user document in Firestore
    4. Return success message
    """
    try:
        # Create user in Firebase Auth (or mock auth)
        firebase_user = firebase_auth.create_user(
            email=user_data.email,
            password=user_data.password,
            email_verified=False
        )
        
        # Create user profile in Firestore
        db = get_db()
        user_doc_data = {
            "email": user_data.email,
            "email_verified": firebase_auth._use_mock_auth,  # Auto-verify in mock mode
            "audio_consent": user_data.audio_consent,
            "created_at": datetime.utcnow(),
            "last_login": None,
            "profile": {},
        }
        
        db.collection(Collections.USERS).document(firebase_user["uid"]).set(user_doc_data)
        
        if firebase_auth._use_mock_auth:
            message = "Account created successfully. You can now log in."
        else:
            message = "Account created successfully. Please verify your email before logging in."
        
        return VerificationResponse(message=message)
        
    except firebase_auth.EmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    except Exception as e:
        error_msg = str(e)
        if "password" in error_msg.lower():
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters",
            )
        logger.error(f"Registration error: {error_msg}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {error_msg}",
        )


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    """
    Authenticate user with email and password.
    
    Returns access token that can be used for subsequent requests.
    Email must be verified before login is allowed.
    """
    try:
        # Check if using mock auth (development mode)
        if firebase_auth._use_mock_auth:
            # Authenticate with mock auth
            user = firebase_auth.get_user_by_email(user_data.email)
            mock_user = firebase_auth._mock_users.get(user["uid"])
            
            if not mock_user or mock_user.get("password") != user_data.password:
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password",
                )
            
            # Create token for mock user
            id_token = firebase_auth.create_custom_token(user["uid"])
            uid = user["uid"]
        else:
            # Authenticate with Firebase REST API
            import requests
            
            api_key = getattr(settings, 'FIREBASE_WEB_API_KEY', None)
            if not api_key:
                # If no API key, fall back to mock auth
                logger.warning("Firebase Web API Key not configured, attempting mock auth")
                firebase_auth._use_mock_auth = True
                return await login(user_data)  # Recursively call with mock auth enabled
            
            response = requests.post(
                f"https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key={api_key}",
                json={
                    "email": user_data.email,
                    "password": user_data.password,
                    "returnSecureToken": True
                },
                timeout=10
            )
            
            if response.status_code != 200:
                error_data = response.json()
                if "error" in error_data:
                    error_message = error_data["error"].get("message", "Invalid credentials")
                    if "INVALID_PASSWORD" in error_message or "USER_NOT_FOUND" in error_message:
                        raise HTTPException(
                            status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Incorrect email or password",
                        )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Incorrect email or password",
                )
            
            data = response.json()
            id_token = data.get("idToken")
            uid = data.get("localId")
        
        # Verify email is verified
        try:
            firebase_user = firebase_auth.verify_id_token(id_token)
            email_verified = firebase_user.get("email_verified", False)
            if not email_verified and not firebase_auth._use_mock_auth:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Email not verified. Please verify your email before logging in.",
                )
        except HTTPException:
            raise
        except Exception as e:
            logger.warning(f"Email verification check failed (non-blocking): {e}")
        
        # Update last login in Firestore
        try:
            db = get_db()
            db.collection(Collections.USERS).document(uid).update({
                "last_login": datetime.utcnow(),
            })
        except Exception as e:
            logger.warning(f"Failed to update last login: {e}")
        
        return Token(access_token=id_token, token_type="bearer")
        
    except HTTPException:
        raise
    except firebase_auth.UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    except Exception as e:
        logger.error(f"Login error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Login failed. Please check your credentials.",
        )


@router.post("/verify-email/resend", response_model=VerificationResponse)
async def resend_email_verification(payload: UserEmail):
    """
    Resend verification email for an existing user.
    """
    try:
        # Check if user exists
        try:
            firebase_user = firebase_auth.get_user_by_email(payload.email)
        except firebase_auth.UserNotFoundError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found",
            )
        
        # Check if already verified
        if firebase_user["email_verified"]:
            return VerificationResponse(message="Email is already verified.")
        
        # Generate verification link (sending via email provider is not wired here)
        verification_link = firebase_auth.generate_email_verification_link(
            payload.email,
            continue_url=settings.EMAIL_VERIFICATION_REDIRECT_URL
        )
        logger.info(f"Generated verification link for {payload.email}: {verification_link}")

        return VerificationResponse(
            message="Verification link generated. Email delivery is not configured; check server logs."
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to resend verification email: {str(e)}",
        )


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
    db = get_db()
    db.collection(Collections.USERS).document(current_user.id).update(
        {"audio_consent": consent}
    )

    return {"audio_consent": consent, "message": "Consent updated successfully"}
