"""
Firebase Authentication helper functions
Handles user creation, email verification, and token management
With fallback mock auth for development without Firebase credentials
"""
import firebase_admin
from firebase_admin import auth as firebase_auth_module
from typing import Optional
import logging
import os
import uuid
from datetime import datetime
import base64

logger = logging.getLogger(__name__)

# Track initialization status
_firebase_initialized = False
_use_mock_auth = False


class EmailAlreadyExistsError(Exception):
    """Raised when email already exists"""
    pass


class UserNotFoundError(Exception):
    """Raised when user not found"""
    pass


class InvalidTokenError(Exception):
    """Raised when token is invalid"""
    pass


# In-memory mock user store for development
_mock_users = {}


def initialize_firebase():
    """Initialize Firebase Admin SDK"""
    global _firebase_initialized, _use_mock_auth
    try:
        if firebase_admin._apps:
            # Already initialized
            _firebase_initialized = True
            _use_mock_auth = False
            return
            
        firebase_admin.initialize_app()
        logger.info("Firebase Admin SDK initialized")
        _firebase_initialized = True
        _use_mock_auth = False
    except Exception as e:
        logger.warning(f"Failed to initialize Firebase Admin: {e}. Using mock auth for development.")
        _firebase_initialized = True  # Mark as initialized so we don't keep trying
        _use_mock_auth = True


def create_user(email: str, password: str, email_verified: bool = False) -> dict:
    """
    Create a new Firebase Auth user
    
    Args:
        email: User email
        password: User password
        email_verified: Whether email is verified
    
    Returns:
        dict with uid and email
    
    Raises:
        EmailAlreadyExistsError: If email already exists
    """
    global _use_mock_auth
    try:
        if not _firebase_initialized:
            initialize_firebase()
        
        # Check if using mock auth
        if _use_mock_auth:
            # Check if email already exists in mock store
            for user in _mock_users.values():
                if user['email'] == email:
                    raise EmailAlreadyExistsError(f"Email {email} already exists")
            
            # Create mock user
            uid = str(uuid.uuid4())
            _mock_users[uid] = {
                "uid": uid,
                "email": email,
                "password": password,  # In production, this would be hashed
                "email_verified": email_verified,
                "created_at": datetime.utcnow()
            }
            logger.info(f"Mock user created: {email}")
            return {
                "uid": uid,
                "email": email,
                "email_verified": email_verified
            }
        
        # Try Firebase - it might fail even if initialized
        try:
            user = firebase_auth_module.create_user(
                email=email,
                password=password,
                email_verified=email_verified
            )
            return {
                "uid": user.uid,
                "email": user.email,
                "email_verified": user.email_verified
            }
        except firebase_auth_module.EmailAlreadyExistsError:
            raise EmailAlreadyExistsError(f"Email {email} already exists")
        except Exception as firebase_error:
            # Fall back to mock auth if Firebase fails
            logger.warning(f"Firebase create_user failed: {firebase_error}. Falling back to mock auth.")
            _use_mock_auth = True
            
            # Check if email already exists in mock store
            for user in _mock_users.values():
                if user['email'] == email:
                    raise EmailAlreadyExistsError(f"Email {email} already exists")
            
            # Create mock user
            uid = str(uuid.uuid4())
            _mock_users[uid] = {
                "uid": uid,
                "email": email,
                "password": password,
                "email_verified": email_verified,
                "created_at": datetime.utcnow()
            }
            logger.info(f"Mock user created (fallback): {email}")
            return {
                "uid": uid,
                "email": email,
                "email_verified": email_verified
            }
    except EmailAlreadyExistsError:
        raise
    except Exception as e:
        raise Exception(f"Failed to create user: {str(e)}")


def get_user_by_email(email: str) -> dict:
    """
    Get user by email
    
    Args:
        email: User email
    
    Returns:
        dict with user data
    
    Raises:
        UserNotFoundError: If user not found
    """
    try:
        if not _firebase_initialized:
            initialize_firebase()
        
        # Check mock auth first
        if _use_mock_auth:
            for user in _mock_users.values():
                if user['email'] == email:
                    return {
                        "uid": user["uid"],
                        "email": user["email"],
                        "email_verified": user.get("email_verified", False)
                    }
            raise UserNotFoundError(f"User with email {email} not found")
        
        # Try Firebase first
        try:
            user = firebase_auth_module.get_user_by_email(email)
            return {
                "uid": user.uid,
                "email": user.email,
                "email_verified": user.email_verified
            }
        except firebase_auth_module.UserNotFoundError:
            raise UserNotFoundError(f"User with email {email} not found")
        except Exception as firebase_error:
            logger.warning(f"Firebase get_user_by_email failed: {firebase_error}. Checking mock auth.")
            # Fall back to mock auth
            for user in _mock_users.values():
                if user['email'] == email:
                    return {
                        "uid": user["uid"],
                        "email": user["email"],
                        "email_verified": user.get("email_verified", False)
                    }
            raise UserNotFoundError(f"User with email {email} not found")
    except UserNotFoundError:
        raise
    except Exception as e:
        raise Exception(f"Failed to get user: {str(e)}")


def get_user(uid: str) -> dict:
    """
    Get user by UID
    
    Args:
        uid: User ID
    
    Returns:
        dict with user data
    
    Raises:
        UserNotFoundError: If user not found
    """
    try:
        if not _firebase_initialized:
            initialize_firebase()
        
        # Check mock auth first
        if _use_mock_auth:
            if uid in _mock_users:
                user = _mock_users[uid]
                return {
                    "uid": user["uid"],
                    "email": user["email"],
                    "email_verified": user.get("email_verified", False)
                }
            raise UserNotFoundError(f"User with UID {uid} not found")
        
        user = firebase_auth_module.get_user(uid)
        return {
            "uid": user.uid,
            "email": user.email,
            "email_verified": user.email_verified
        }
    except UserNotFoundError:
        raise
    except firebase_auth_module.UserNotFoundError:
        raise UserNotFoundError(f"User with UID {uid} not found")
    except Exception as e:
        raise Exception(f"Failed to get user: {str(e)}")


def generate_email_verification_link(email: str, continue_url: Optional[str] = None) -> str:
    """
    Generate email verification link
    
    Args:
        email: User email
        continue_url: Optional URL to redirect after verification
    
    Returns:
        Verification link
    """
    try:
        if not _firebase_initialized:
            initialize_firebase()
        
        # For mock auth, generate a simple verification link
        if _use_mock_auth:
            import hashlib
            code = hashlib.md5(f"{email}{datetime.utcnow()}".encode()).hexdigest()[:20]
            base_url = continue_url or "http://localhost:5173"
            return f"{base_url}/verify?code={code}&email={email}"
        
        action_code_settings = None
        if continue_url:
            action_code_settings = firebase_auth_module.ActionCodeSettings(
                url=continue_url,
                handle_code_in_app=False
            )
        
        link = firebase_auth_module.generate_email_verification_link(
            email,
            action_code_settings=action_code_settings
        )
        return link
    except Exception as e:
        raise Exception(f"Failed to generate verification link: {str(e)}")


def create_custom_token(uid: str) -> str:
    """
    Create custom token for user
    
    Args:
        uid: User ID
    
    Returns:
        Custom token as string
    """
    try:
        if not _firebase_initialized:
            initialize_firebase()
        
        # For mock auth, generate a simple JWT-like token
        if _use_mock_auth:
            token_data = f"{uid}:{datetime.utcnow().isoformat()}"
            mock_token = base64.b64encode(token_data.encode()).decode()
            return mock_token
        
        token = firebase_auth_module.create_custom_token(uid)
        return token.decode('utf-8') if isinstance(token, bytes) else token
    except Exception as e:
        raise Exception(f"Failed to create custom token: {str(e)}")


def verify_id_token(id_token: str) -> dict:
    """
    Verify Firebase ID token
    
    Args:
        id_token: Firebase ID token
    
    Returns:
        Decoded token data
    
    Raises:
        InvalidTokenError: If token is invalid
    """
    try:
        if not _firebase_initialized:
            initialize_firebase()
        
        # For mock auth, decode the simple token
        if _use_mock_auth:
            try:
                token_data = base64.b64decode(id_token).decode()
                uid = token_data.split(':')[0]
                if uid in _mock_users:
                    return {"uid": uid, "email": _mock_users[uid]["email"]}
            except:
                pass
            raise InvalidTokenError("Invalid ID token")
        
        decoded_token = firebase_auth_module.verify_id_token(id_token)
        return decoded_token
    except InvalidTokenError:
        raise
    except firebase_auth_module.InvalidIdTokenError:
        raise InvalidTokenError("Invalid ID token")
    except firebase_auth_module.ExpiredIdTokenError:
        raise InvalidTokenError("Token has expired")
    except Exception as e:
        raise InvalidTokenError(f"Token verification failed: {str(e)}")


def update_user(uid: str, **kwargs) -> dict:
    """
    Update user properties
    
    Args:
        uid: User ID
        **kwargs: Properties to update (email, password, email_verified, etc.)
    
    Returns:
        Updated user data
    """
    try:
        if not _firebase_initialized:
            initialize_firebase()
        
        # For mock auth, update the in-memory user
        if _use_mock_auth:
            if uid not in _mock_users:
                raise UserNotFoundError(f"User with UID {uid} not found")
            _mock_users[uid].update(kwargs)
            return {
                "uid": _mock_users[uid]["uid"],
                "email": _mock_users[uid]["email"],
                "email_verified": _mock_users[uid].get("email_verified", False)
            }
        
        user = firebase_auth_module.update_user(uid, **kwargs)
        return {
            "uid": user.uid,
            "email": user.email,
            "email_verified": user.email_verified
        }
    except UserNotFoundError:
        raise
    except firebase_auth_module.UserNotFoundError:
        raise UserNotFoundError(f"User with UID {uid} not found")
    except Exception as e:
        raise Exception(f"Failed to update user: {str(e)}")


def delete_user(uid: str):
    """
    Delete user
    
    Args:
        uid: User ID
    
    Raises:
        UserNotFoundError: If user not found
    """
    try:
        if not _firebase_initialized:
            initialize_firebase()
        
        # For mock auth, delete from in-memory store
        if _use_mock_auth:
            if uid not in _mock_users:
                raise UserNotFoundError(f"User with UID {uid} not found")
            del _mock_users[uid]
            return
        
        firebase_auth_module.delete_user(uid)
    except UserNotFoundError:
        raise
    except firebase_auth_module.UserNotFoundError:
        raise UserNotFoundError(f"User with UID {uid} not found")
    except Exception as e:
        raise Exception(f"Failed to delete user: {str(e)}")
