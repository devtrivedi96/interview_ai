"""
Profile routes - User profile and preferences management
"""
from typing import Optional, Dict, Any, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from src.auth.security import get_current_user_firebase
from src.db.firebase_client import get_db, Collections
from src.db.models import User

router = APIRouter()


class TechStack(BaseModel):
    """Technology stack preferences"""
    name: str
    level: str = "intermediate"  # beginner, intermediate, advanced


class CareerPreferences(BaseModel):
    """User's career and interview preferences"""
    tech_stack: List[str] = []  # e.g., ["Python", "JavaScript", "Java"]
    preferred_roles: List[str] = []  # e.g., ["Backend Engineer", "Full Stack"]
    experience_level: str = "intermediate"  # junior, intermediate, senior, lead
    target_company_type: str = "product"  # product, startup, consultant, other
    preferred_interview_modes: List[str] = []  # e.g., ["DSA", "System Design", "Behavioral"]


class PreferencesResponse(BaseModel):
    """Preferences endpoint response"""
    exists: bool
    preferences: Optional[CareerPreferences] = None


class PreferencesSaveRequest(BaseModel):
    """Request to save preferences"""
    tech_stack: List[str]
    preferred_roles: List[str]
    experience_level: str
    target_company_type: str
    preferred_interview_modes: List[str]


@router.get("/preferences", response_model=PreferencesResponse)
async def get_preferences(current_user: User = Depends(get_current_user_firebase)):
    """
    Get user's interview preferences.
    
    Returns:
    - exists: true/false if preferences have been set
    - preferences: The preferences object or null
    """
    db = get_db()
    user_ref = db.collection(Collections.USERS).document(current_user.id)
    user_doc = user_ref.get()
    
    if not user_doc.exists:
        return PreferencesResponse(exists=False, preferences=None)
    
    user_data = user_doc.to_dict() or {}
    profile_data = user_data.get("profile", {})
    preferences = profile_data.get("preferences")
    
    if not preferences:
        return PreferencesResponse(exists=False, preferences=None)
    
    return PreferencesResponse(
        exists=True,
        preferences=CareerPreferences(**preferences)
    )


@router.post("/preferences", response_model=PreferencesResponse)
async def save_preferences(
    prefs: PreferencesSaveRequest,
    current_user: User = Depends(get_current_user_firebase)
):
    """
    Save user's interview preferences.
    
    Stores preferences in users/{user_id}/profile/preferences
    """
    db = get_db()
    user_ref = db.collection(Collections.USERS).document(current_user.id)
    
    preferences_data = {
        "tech_stack": prefs.tech_stack,
        "preferred_roles": prefs.preferred_roles,
        "experience_level": prefs.experience_level,
        "target_company_type": prefs.target_company_type,
        "preferred_interview_modes": prefs.preferred_interview_modes,
        "updated_at": datetime.utcnow(),
    }
    
    try:
        # Update user's profile with preferences
        user_ref.update({
            "profile": {
                "preferences": preferences_data
            }
        })
        
        return PreferencesResponse(
            exists=True,
            preferences=CareerPreferences(**preferences_data)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save preferences: {str(e)}",
        )
