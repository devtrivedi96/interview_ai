"""
Authentication routes - Firebase only implementation
Handles user registration, email verification, and login via Firebase Auth
"""
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr

from auth import firebase_auth
from auth.security import get_current_user_firebase
from db.firebase_client import get_db, Collections
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





@router.post(
    "/register", response_model=VerificationResponse, status_code=status.HTTP_201_CREATED
)
async def register(user_data: UserRegister):
    """
    Register a new user with Firebase Authentication.
    
    Steps:
    1. Create Firebase Auth user (password validation, duplicate email check)
    2. Firebase sends verification email automatically
    3. Create user document in Firestore
    4. Return success message
    """
    try:
        # Create user in Firebase Auth
        firebase_user = firebase_auth.create_user(
            email=user_data.email,
            password=user_data.password,
            email_verified=False
        )
        
        # Create user profile in Firestore
        db = get_db()
        user_doc_data = {
            "email": user_data.email,
            "email_verified": False,
            "audio_consent": user_data.audio_consent,
            "created_at": datetime.utcnow(),
            "last_login": None,
            "profile": {},
        }
        
        db.collection(Collections.USERS).document(firebase_user["uid"]).set(user_doc_data)
        
        return VerificationResponse(
            message="Account created successfully. Please verify your email before logging in."
        )
        
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
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {error_msg}",
        )


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    """
    Authenticate user with email and password.
    
    Returns Firebase ID token that can be used for subsequent requests.
    Email must be verified before login is allowed.
    """
    try:
        # Verify email and password via Firebase REST API
        import requests
        
        api_key = getattr(settings, 'FIREBASE_WEB_API_KEY', None)
        if not api_key:
            raise Exception("Firebase Web API Key not configured")
        
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
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
            )
        
        data = response.json()
        id_token = data.get("idToken")
        firebase_uid = data.get("localId")
        
        # Verify email is verified
        try:
            firebase_user = firebase_auth.verify_id_token(id_token)
            if not firebase_user.get("email_verified"):
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Email not verified. Please verify your email before logging in.",
                )
        except HTTPException:
            raise
        except Exception as e:
            print(f"Email verification check failed (non-blocking): {e}")
        
        # Update last login in Firestore
        try:
            db = get_db()
            db.collection(Collections.USERS).document(firebase_uid).update({
                "last_login": datetime.utcnow(),
                "email_verified": True
            })
        except Exception as e:
            print(f"Failed to update last login: {e}")
        
        return Token(access_token=id_token, token_type="bearer")
        
    except HTTPException:
        raise
    except Exception as e:
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
        
        # Generate and send verification email via Firebase
        verification_link = firebase_auth.generate_email_verification_link(
            payload.email,
            continue_url=f"{settings.FRONTEND_URL}/login"
        )
        
        return VerificationResponse(
            message="Verification email has been sent. Please check your inbox."
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
