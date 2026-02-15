"""
Firebase Firestore database connection
"""
import firebase_admin
from firebase_admin import credentials, firestore
from core.config import settings
import os

# Initialize Firebase
def init_firebase():
    """Initialize Firebase Admin SDK"""
    if not firebase_admin._apps:
        if os.path.exists(settings.FIREBASE_CREDENTIALS_PATH):
            cred = credentials.Certificate(settings.FIREBASE_CREDENTIALS_PATH)
            firebase_admin.initialize_app(cred)
        else:
            # For development, use default credentials
            firebase_admin.initialize_app()
    
    return firestore.client()


# Get Firestore client
def get_db():
    """Get Firestore database client"""
    return firestore.client()
