"""
Session management routes
Handles interview session lifecycle
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

from src.db.firebase_client import get_db, Collections
from src.db.models import User, InterviewSession, SessionState, InterviewMode
from src.auth.security import get_current_user_firebase, require_audio_consent
from src.session_engine.engine import InterviewEngine
from src.session_engine.state_machine import SessionStateMachine
from src.stt_adapter.service import STTService
from src.ai_evaluator.service import AIEvaluatorService
from src.ai_evaluator.content_generator import AIContentGenerator
from src.utils.config import settings
from src.ai.bedrock_service import BedrockService

router = APIRouter()
bedrock = BedrockService()


class SessionCreate(BaseModel):
    mode: str
    difficulty_start: int = 3


# ==============================
# CREATE SESSION
# ==============================

@router.post("", status_code=status.HTTP_201_CREATED)
async def create_session(
    session_data: SessionCreate,
    current_user: User = Depends(get_current_user_firebase)
):
    db = get_db()

    try:
        mode = InterviewMode(session_data.mode)
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid mode. Must be one of {[m.value for m in InterviewMode]}"
        )

    if not 1 <= session_data.difficulty_start <= 5:
        raise HTTPException(
            status_code=400,
            detail="Difficulty must be between 1 and 5"
        )

    session_ref = db.collection(Collections.SESSIONS).document()
    session = InterviewSession(
        id=session_ref.id,
        user_id=current_user.id,
        mode=mode,
        difficulty_start=session_data.difficulty_start,
        difficulty_current=session_data.difficulty_start,
        state=SessionState.INIT
    )

    session_ref.set(session.to_dict())

    return {
        "id": session.id,
        "mode": session.mode.value,
        "difficulty_start": session.difficulty_start,
        "state": session.state.value,
        "created_at": session.created_at
    }


# ==============================
# START SESSION + GENERATE FIRST QUESTION (Bedrock)
# ==============================

@router.post("/{session_id}/start")
async def start_session(
    session_id: str,
    current_user: User = Depends(get_current_user_firebase)
):
    db = get_db()

    session_doc = db.collection(Collections.SESSIONS).document(session_id).get()
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")

    session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())

    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    state_machine = SessionStateMachine(session)

    if not state_machine.transition(SessionState.ASK_QUESTION):
        raise HTTPException(
            status_code=400,
            detail=f"Cannot start session from state {session.state.value}"
        )

    # 🔥 Generate First Question Using Bedrock
    question_text = bedrock.generate_question(
        mode=session.mode.value,
        difficulty=session.difficulty_current
    )

    question_ref = db.collection(Collections.SESSION_QUESTIONS).document()

    question_ref.set({
        "session_id": session.id,
        "question_text": question_text,
        "difficulty": session.difficulty_current,
        "created_at": datetime.utcnow()
    })

    # Update question count
    db.collection(Collections.SESSIONS).document(session.id).update({
        "questions_count": session.questions_count + 1
    })

    return {
        "status": "started",
        "question_id": question_ref.id,
        "question_text": question_text,
        "difficulty": session.difficulty_current
    }


# ==============================
# NEXT QUESTION (Adaptive)
# ==============================

@router.post("/{session_id}/questions/next")
async def get_next_question(
    session_id: str,
    current_user: User = Depends(get_current_user_firebase)
):
    db = get_db()

    session_doc = db.collection(Collections.SESSIONS).document(session_id).get()
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")

    session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())

    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    if session.questions_count >= settings.MAX_QUESTIONS_PER_SESSION:
        raise HTTPException(
            status_code=400,
            detail="Maximum questions reached"
        )

    # 🔥 Generate next question using Bedrock
    question_text = bedrock.generate_question(
        mode=session.mode.value,
        difficulty=session.difficulty_current
    )

    question_ref = db.collection(Collections.SESSION_QUESTIONS).document()
    question_ref.set({
        "session_id": session.id,
        "question_text": question_text,
        "difficulty": session.difficulty_current,
        "created_at": datetime.utcnow()
    })

    db.collection(Collections.SESSIONS).document(session.id).update({
        "questions_count": session.questions_count + 1
    })

    return {
        "question_id": question_ref.id,
        "question_text": question_text,
        "difficulty": session.difficulty_current
    }


# ==============================
# GET INTERVIEW MODE CARDS
# ==============================

@router.get("/modes/cards")
async def get_interview_cards():
    """Get available interview mode cards"""
    cards = []
    for mode in InterviewMode:
        cards.append({
            "id": mode.value,
            "key": mode.value,
            "mode": mode.value,
            "title": mode.value.replace("_", " ").title(),
            "description": f"Practice {mode.value.replace('_', ' ')} interviews",
            "iconColor": "blue"
        })
    return {"cards": cards}


# ==============================
# LIST SESSIONS
# ==============================

@router.get("")
async def list_sessions(
    limit: int = 10,
    current_user: User = Depends(get_current_user_firebase)
):
    """List sessions for the current user"""
    db = get_db()
    
    sessions_query = (
        db.collection(Collections.SESSIONS)
        .where("user_id", "==", current_user.id)
        .order_by("created_at", direction="DESCENDING")
        .limit(limit)
    )
    
    sessions = []
    for doc in sessions_query.stream():
        session_data = doc.to_dict()
        session = InterviewSession.from_dict(doc.id, session_data)
        sessions.append({
            "id": session.id,
            "mode": session.mode.value,
            "difficulty_start": session.difficulty_start,
            "state": session.state.value,
            "created_at": session.created_at,
            "questions_count": session.questions_count
        })
    
    return {"sessions": sessions}


# ==============================
# GET SESSION SUMMARY
# ==============================

@router.get("/{session_id}/summary")
async def get_session_summary(
    session_id: str,
    current_user: User = Depends(get_current_user_firebase)
):
    """Get session summary"""
    db = get_db()
    
    session_doc = db.collection(Collections.SESSIONS).document(session_id).get()
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    return {
        "id": session.id,
        "mode": session.mode.value,
        "difficulty_start": session.difficulty_start,
        "difficulty_current": session.difficulty_current,
        "state": session.state.value,
        "questions_count": session.questions_count,
        "created_at": session.created_at,
        "score": getattr(session, 'score', None)
    }


# ==============================
# SUBMIT ANSWER
# ==============================

@router.post("/{session_id}/questions/{question_id}/answer")
async def submit_answer(
    session_id: str,
    question_id: str,
    transcript: Optional[str] = Form(None),
    audio_file: Optional[UploadFile] = File(None),
    audio_duration_sec: Optional[float] = Form(None),
    current_user: User = Depends(get_current_user_firebase)
):
    """Submit answer for a question"""
    db = get_db()
    
    session_doc = db.collection(Collections.SESSIONS).document(session_id).get()
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Store answer
    answer_ref = db.collection(Collections.ANSWERS).document()
    answer_ref.set({
        "session_id": session_id,
        "question_id": question_id,
        "transcript": transcript,
        "audio_duration_sec": audio_duration_sec,
        "created_at": datetime.utcnow()
    })
    
    # TODO: Evaluate answer using AI
    # evaluation = evaluator.evaluate_answer(transcript)
    
    return {
        "answer_id": answer_ref.id,
        "status": "received",
        "score": None  # Will be populated after evaluation
    }


# ==============================
# COMPLETE SESSION
# ==============================

@router.post("/{session_id}/complete")
async def complete_session(
    session_id: str,
    current_user: User = Depends(get_current_user_firebase)
):
    """Complete a session"""
    db = get_db()
    
    session_doc = db.collection(Collections.SESSIONS).document(session_id).get()
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Update session state
    db.collection(Collections.SESSIONS).document(session_id).update({
        "state": SessionState.COMPLETE.value,
        "completed_at": datetime.utcnow()
    })
    
    return {
        "status": "completed",
        "session_id": session_id
    }
