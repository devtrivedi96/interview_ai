"""
Firebase Authentication helper functions
Handles user creation, email verification, and token management
"""
import firebase_admin
from firebase_admin import auth as firebase_auth
from typing import Optional


class EmailAlreadyExistsError(Exception):
    """Raised when email already exists"""
    pass


class UserNotFoundError(Exception):
    """Raised when user not found"""
    pass


class InvalidTokenError(Exception):
    """Raised when token is invalid"""
    pass


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
    try:
        user = firebase_auth.create_user(
            email=email,
            password=password,
            email_verified=email_verified
        )
        return {
            "uid": user.uid,
            "email": user.email,
            "email_verified": user.email_verified
        }
    except firebase_auth.EmailAlreadyExistsError:
        raise EmailAlreadyExistsError(f"Email {email} already exists")
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
        user = firebase_auth.get_user_by_email(email)
        return {
            "uid": user.uid,
            "email": user.email,
            "email_verified": user.email_verified
        }
    except firebase_auth.UserNotFoundError:
        raise UserNotFoundError(f"User with email {email} not found")
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
        user = firebase_auth.get_user(uid)
        return {
            "uid": user.uid,
            "email": user.email,
            "email_verified": user.email_verified
        }
    except firebase_auth.UserNotFoundError:
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
        action_code_settings = None
        if continue_url:
            action_code_settings = firebase_auth.ActionCodeSettings(
                url=continue_url,
                handle_code_in_app=False
            )
        
        link = firebase_auth.generate_email_verification_link(
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
        token = firebase_auth.create_custom_token(uid)
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
        decoded_token = firebase_auth.verify_id_token(id_token)
        return decoded_token
    except firebase_auth.InvalidIdTokenError:
        raise InvalidTokenError("Invalid ID token")
    except firebase_auth.ExpiredIdTokenError:
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
        user = firebase_auth.update_user(uid, **kwargs)
        return {
            "uid": user.uid,
            "email": user.email,
            "email_verified": user.email_verified
        }
    except firebase_auth.UserNotFoundError:
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
        firebase_auth.delete_user(uid)
    except firebase_auth.UserNotFoundError:
        raise UserNotFoundError(f"User with UID {uid} not found")
    except Exception as e:
        raise Exception(f"Failed to delete user: {str(e)}")
