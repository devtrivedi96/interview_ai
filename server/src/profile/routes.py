"""Profile routes - User profile, preferences, and AI-driven helpers."""
from typing import Optional, Dict, Any, List
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel

from src.auth.security import get_current_user_firebase
from src.db.firebase_client import get_db, Collections
from src.db.models import User, InterviewMode
from src.ai.bedrock_service import BedrockService
from src.ai_evaluator.content_generator import AIContentGenerator, DEFAULT_MODE_CARDS

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


class PreparationPlanRequest(BaseModel):
    topics: List[str]


class SuggestedInterviewResponse(BaseModel):
    """AI-suggested interview configuration for the dashboard."""

    mode: str
    title: str
    subtitle: Optional[str] = None
    description: Optional[str] = None
    difficulty: int
    sample_questions: List[str]
    source: str  # "ai" or "fallback"


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
        # Upsert user profile with preferences
        user_ref.set(
            {
                "email": current_user.email,
                "email_verified": True,
                "audio_consent": current_user.audio_consent,
                "profile": {
                    "preferences": preferences_data
                },
                "updated_at": datetime.utcnow(),
            },
            merge=True,
        )
        
        return PreferencesResponse(
            exists=True,
            preferences=CareerPreferences(**preferences_data)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save preferences: {str(e)}",
        )


@router.post("/preparation/plan")
async def generate_preparation_plan(
    req: PreparationPlanRequest,
    current_user: User = Depends(get_current_user_firebase),
):
    """Generate learning plan from user topics using AI."""
    topics = [t.strip() for t in req.topics if t and t.strip()]
    if not topics:
        raise HTTPException(status_code=400, detail="At least one topic is required")

    db = get_db()
    user_doc = db.collection(Collections.USERS).document(current_user.id).get()
    preferences = None
    if user_doc.exists:
        user_data = user_doc.to_dict() or {}
        preferences = (user_data.get("profile") or {}).get("preferences")

    generator = AIContentGenerator()
    plan = generator.generate_preparation_plan(topics=topics, preferences=preferences)
    return {"topics": topics, "plan": plan}


@router.get("/preparation/suggested-topics")
async def get_suggested_topics(
    current_user: User = Depends(get_current_user_firebase),
):
    """Get AI-suggested preparation topics based on user profile."""
    db = get_db()
    user_doc = db.collection(Collections.USERS).document(current_user.id).get()
    preferences = None
    
    if user_doc.exists:
        user_data = user_doc.to_dict() or {}
        preferences = (user_data.get("profile") or {}).get("preferences")
    
    generator = AIContentGenerator()
    
    # Extract preferences for topic suggestions
    experience_level = "intermediate"
    preferred_roles = None
    tech_stack = None
    
    if preferences:
        experience_level = preferences.get("experience_level", "intermediate")
        preferred_roles = preferences.get("preferred_roles", None)
        tech_stack = preferences.get("tech_stack", None)
    
    topics = generator.generate_suggested_topics(
        experience_level=experience_level,
        preferred_roles=preferred_roles,
        tech_stack=tech_stack
    )
    
    return {"topics": topics}


class ConceptLearningRequest(BaseModel):
    concept: str


@router.post("/preparation/concept-learning")
async def get_concept_learning(
    req: ConceptLearningRequest,
    current_user: User = Depends(get_current_user_firebase),
):
    """Get detailed learning material for a specific concept."""
    concept = req.concept.strip()
    if not concept or len(concept) < 2:
        raise HTTPException(status_code=400, detail="Concept name must be at least 2 characters")
    
    if len(concept) > 100:
        raise HTTPException(status_code=400, detail="Concept name must be less than 100 characters")
    
    generator = AIContentGenerator()
    learning_material = generator.generate_concept_learning(concept=concept)
    
    return {
        "concept": concept,
        "learning_material": learning_material
    }


@router.get("/preparation/personalized-topics")
async def get_personalized_topics(
    current_user: User = Depends(get_current_user_firebase),
):
    """Get personalized preparation topics based on completed interview performance."""
    db = get_db()
    
    # Get completed sessions for the user
    sessions_query = (
        db.collection(Collections.SESSIONS)
        .where("user_id", "==", current_user.id)
        .where("state", "==", "COMPLETE")
        .order_by("completed_at", direction="DESCENDING")
        .limit(20)
    )
    
    completed_sessions = []
    for doc in sessions_query.stream():
        completed_sessions.append(doc.to_dict())
    
    # If no completed sessions, return None to indicate they should generate their own topics
    if not completed_sessions:
        return {"has_interview_history": False, "topics": None}
    
    # Analyze performance across different modes and difficulty levels
    performance_analysis = {
        "weak_areas": [],
        "strong_areas": [],
        "lower_scores": [],
        "modes_attempted": set(),
        "average_score": 0,
    }
    
    total_score = 0
    for session in completed_sessions:
        mode = session.get("mode", "unknown")
        score = session.get("total_score", 0)
        performance_analysis["modes_attempted"].add(mode)
        total_score += score
        
        if score < 60:
            performance_analysis["lower_scores"].append({
                "mode": mode,
                "score": score,
                "difficulty": session.get("difficulty_start", 3)
            })
    
    if completed_sessions:
        performance_analysis["average_score"] = total_score / len(completed_sessions)
    
    # Get user preferences
    user_doc = db.collection(Collections.USERS).document(current_user.id).get()
    preferences = None
    if user_doc.exists:
        user_data = user_doc.to_dict() or {}
        preferences = (user_data.get("profile") or {}).get("preferences")
    
    # Generate personalized topics based on weak areas
    generator = AIContentGenerator()
    
    # Build context for AI
    context = f"""
User has completed {len(completed_sessions)} interviews.
Average score: {performance_analysis['average_score']:.1f}/100
Modes attempted: {', '.join(performance_analysis['modes_attempted'])}
"""
    
    if performance_analysis["lower_scores"]:
        context += f"\nAreas needing improvement:\n"
        for item in performance_analysis["lower_scores"][:5]:
            context += f"- {item['mode']} (Score: {item['score']})\n"
    
    prompt = (
        "Based on the user's interview performance, generate 5-7 highly personalized "
        "preparation topics that address their weak areas. Each topic has 'name' and "
        "'description' (max 80 chars). Focus on topics that will help them improve "
        "their interview performance.\n\n"
        f"Context: {context}\n\n"
        "Return valid JSON array only."
    )
    
    try:
        data = generator._generate_json(prompt)
        topics = data if isinstance(data, list) else data.get("topics", [])
        if isinstance(topics, list) and len(topics) > 0:
            return {
                "has_interview_history": True,
                "topics": topics[:7],
                "performance_summary": {
                    "completed_interviews": len(completed_sessions),
                    "average_score": round(performance_analysis["average_score"], 1),
                }
            }
    except Exception as e:
        logger.warning(f"AI personalized topic generation failed: {e}")
    
    # Fallback: return None to indicate generic topics should be used
    return {
        "has_interview_history": True,
        "topics": None,
        "performance_summary": {
            "completed_interviews": len(completed_sessions),
            "average_score": round(performance_analysis["average_score"], 1),
        }
    }


@router.get("/suggested-interview", response_model=SuggestedInterviewResponse)
async def get_suggested_interview(
    current_user: User = Depends(get_current_user_firebase),
):
    """Return an AI-suggested interview setup and sample questions.

    Uses saved preferences (if any) plus AIContentGenerator and BedrockService
    to recommend an interview mode + starting difficulty and 2-3 example
    questions. Falls back to static defaults if AI is unavailable.
    """

    db = get_db()
    user_doc = db.collection(Collections.USERS).document(current_user.id).get()

    preferences: Optional[Dict[str, Any]] = None
    if user_doc.exists:
        user_data = user_doc.to_dict() or {}
        preferences = (user_data.get("profile") or {}).get("preferences")

    generator = AIContentGenerator()

    # 1. Try AI-generated mode cards using preferences
    cards: List[Dict[str, Any]] = []
    try:
        cards = generator.generate_mode_cards(preferences=preferences)
    except Exception:
        cards = []

    source = "ai" if cards else "fallback"
    if not cards:
        # Fallback to built-in defaults
        cards = DEFAULT_MODE_CARDS

    # 2. Pick the best card based on preferred modes, else first card
    preferred_modes: List[str] = []
    primary_language: Optional[str] = None
    if preferences and isinstance(preferences, dict):
        preferred_modes = preferences.get("preferred_interview_modes") or []
        tech_stack = preferences.get("tech_stack") or []
        if isinstance(tech_stack, list) and tech_stack:
            primary_language = str(tech_stack[0])

    best_card = cards[0]
    if preferred_modes:
        pref_set = {str(m).upper() for m in preferred_modes}
        for card in cards:
            mode_val = str(card.get("mode") or "").upper()
            if mode_val in pref_set:
                best_card = card
                break

    mode_str = str(best_card.get("mode") or "DSA").upper()
    try:
        mode_enum = InterviewMode(mode_str)
    except ValueError:
        mode_enum = InterviewMode.DSA

    difficulty = int(best_card.get("difficulty_start") or 3)
    difficulty = max(1, min(5, difficulty))

    # 3. Generate a few sample questions using BedrockService (with its fallbacks)
    # Reduced from 3 to 2 to minimize API calls. Use cached static fallbacks instead.
    bedrock = BedrockService()
    sample_questions: List[str] = []
    for _ in range(2):
        try:
            q = bedrock.generate_question(
                mode=mode_enum.value,
                difficulty=difficulty,
                language=primary_language,
            )
            if q and q not in sample_questions:
                sample_questions.append(q)
        except Exception:
            # If Bedrock + fallbacks are unavailable, we still return what we have
            break  # Break early instead of retrying on failure

    if not sample_questions:
        # Last-resort static question to avoid empty UI
        sample_questions = [
            "Walk me through a recent project you're proud of.",
            "Explain how you would approach debugging a tricky production issue.",
        ]

    return SuggestedInterviewResponse(
        mode=mode_enum.value,
        title=str(best_card.get("title") or mode_enum.value.title()),
        subtitle=best_card.get("subtitle"),
        description=best_card.get("description"),
        difficulty=difficulty,
        sample_questions=sample_questions,
        source=source,
    )
