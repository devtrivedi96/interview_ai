"""
Authentication routes with Firebase Auth and Email Verification
"""
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel, EmailStr
from datetime import datetime

from src.db.firebase_client import get_db, Collections
from src.db.models import User
from src.auth import firebase_auth
from src.auth.security import get_current_user_firebase

router = APIRouter()


class UserRegister(BaseModel):
    email: EmailStr
    password: str
    audio_consent: bool = False


class UserLogin(BaseModel):
    id_token: str  # Firebase ID token from client


class Token(BaseModel):
    custom_token: str
    token_type: str = "bearer"
    user: dict


class UserResponse(BaseModel):
    id: str
    email: str
    email_verified: bool
    audio_consent: bool
    created_at: datetime


class EmailVerification(BaseModel):
    email: EmailStr


@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_data: UserRegister):
    """
    Register a new user with Firebase Authentication
    
    Steps:
    1. Create Firebase Auth user
    2. Generate email verification link
    3. Create user document in Firestore
    4. Return verification link (in production, send via email service)
    """
    db = get_db()
    
    try:
        # Create Firebase Auth user
        firebase_user = firebase_auth.create_user(
            email=user_data.email,
            password=user_data.password,
            email_verified=False
        )
        
        # Generate email verification link
        verification_link = firebase_auth.generate_email_verification_link(
            user_data.email,
            continue_url="http://localhost:3000/login"  # Redirect after verification
        )
        
        # Create user document in Firestore
        user_ref = db.collection(Collections.USERS).document(firebase_user["uid"])
        user = User(
            id=firebase_user["uid"],
            email=user_data.email,
            hashed_password="",  # Not needed with Firebase Auth
            email_verified=False,
            audio_consent=user_data.audio_consent
        )
        user_ref.set(user.to_dict())
        
        # In production, send verification_link via email service (SendGrid, AWS SES, etc.)
        # For now, return it in response for testing
        
        return {
            "message": "User registered successfully. Please verify your email.",
            "user_id": firebase_user["uid"],
            "email": user_data.email,
            "verification_link": verification_link,
            "note": "In production, this link would be sent via email"
        }
        
    except firebase_auth.EmailAlreadyExistsError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )


@router.post("/login", response_model=Token)
async def login(user_data: UserLogin):
    """
    Authenticate user with Firebase ID token
    
    Client should:
    1. Use Firebase SDK to sign in with email/password
    2. Get ID token from Firebase
    3. Send ID token to this endpoint
    
    This endpoint:
    1. Verifies the ID token
    2. Checks email verification status
    3. Returns custom token for API access
    """
    try:
        # Verify ID token
        decoded_token = firebase_auth.verify_id_token(user_data.id_token)
        user_id = decoded_token['uid']
        email = decoded_token.get('email')
        email_verified = decoded_token.get('email_verified', False)
        
        # Check if email is verified
        if not email_verified:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Please verify your email before logging in. Check your inbox for the verification link."
            )
        
        # Get/update user data in Firestore
        db = get_db()
        user_ref = db.collection(Collections.USERS).document(user_id)
        user_doc = user_ref.get()
        
        if user_doc.exists:
            user_data_dict = user_doc.to_dict()
            # Update last login and email verification status
            user_ref.update({
                'last_login': datetime.utcnow(),
                'email_verified': True
            })
        else:
            # Create user document if it doesn't exist
            user = User(
                id=user_id,
                email=email,
                hashed_password="",
                email_verified=True,
                audio_consent=False
            )
            user_ref.set(user.to_dict())
            user_data_dict = user.to_dict()
        
        # Create custom token for API access when admin credentials allow it.
        # In local/dev, Firebase Admin may not have signing credentials; fallback
        # to the already-verified client ID token so login does not 500.
        try:
            custom_token = firebase_auth.create_custom_token(user_id)
        except Exception:
            custom_token = user_data.id_token
        
        return Token(
            custom_token=custom_token,
            token_type="bearer",
            user={
                "id": user_id,
                "email": email,
                "email_verified": email_verified,
                "audio_consent": user_data_dict.get('audio_consent', False)
            }
        )
        
    except firebase_auth.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )


@router.post("/verify-token")
async def verify_token(id_token: str):
    """
    Verify Firebase ID token
    Used by client to validate authentication state
    """
    try:
        decoded_token = firebase_auth.verify_id_token(id_token)
        user_id = decoded_token['uid']
        
        db = get_db()
        user_doc = db.collection(Collections.USERS).document(user_id).get()
        
        if not user_doc.exists:
            raise HTTPException(status_code=404, detail="User not found in database")
        
        user_data = user_doc.to_dict()
        
        return {
            "valid": True,
            "user": {
                "id": user_id,
                "email": decoded_token.get('email'),
                "email_verified": decoded_token.get('email_verified', False),
                "audio_consent": user_data.get('audio_consent', False)
            }
        }
    except firebase_auth.InvalidTokenError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token verification failed: {str(e)}"
        )


@router.post("/resend-verification")
async def resend_verification(data: EmailVerification):
    """
    Resend email verification link
    """
    try:
        firebase_user = firebase_auth.get_user_by_email(data.email)
        
        if firebase_user["email_verified"]:
            return {"message": "Email already verified"}
        
        verification_link = firebase_auth.generate_email_verification_link(
            data.email,
            continue_url="http://localhost:3000/login"
        )
        
        # In production, send via email service
        
        return {
            "message": "Verification email sent. Please check your inbox.",
            "verification_link": verification_link,
            "note": "In production, this link would be sent via email"
        }
        
    except firebase_auth.UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to send verification email: {str(e)}"
        )


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user_firebase)):
    """Get current user profile"""
    return UserResponse(
        id=current_user.id,
        email=current_user.email,
        email_verified=current_user.email_verified,
        audio_consent=current_user.audio_consent,
        created_at=current_user.created_at
    )


@router.post("/consent/audio")
async def update_audio_consent(
    consent: bool,
    current_user: User = Depends(get_current_user_firebase)
):
    """Update user's audio recording consent"""
    db = get_db()
    db.collection(Collections.USERS).document(current_user.id).update({
        'audio_consent': consent
    })
    
    return {"audio_consent": consent, "message": "Consent updated successfully"}
