"""
Session management routes
Handles interview session lifecycle
"""
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional

from src.db.firebase_client import get_db, Collections
from src.db.models import User, InterviewSession, SessionState, InterviewMode
from src.auth.security import get_current_user_firebase, require_audio_consent
from src.session_engine.engine import InterviewEngine
from src.session_engine.state_machine import SessionStateMachine
from src.stt_adapter.service import STTService
from src.ai_evaluator.service import AIEvaluatorService
from src.ai_evaluator.content_generator import AIContentGenerator
from src.utils.config import settings

router = APIRouter()


class SessionCreate(BaseModel):
    mode: str  # DSA, HR, BEHAVIORAL, SYSTEM_DESIGN
    difficulty_start: int = 3


class AnswerSubmit(BaseModel):
    transcript: Optional[str] = None
    audio_duration_sec: Optional[float] = None


@router.get("/modes/cards")
async def get_interview_mode_cards(
    current_user: User = Depends(get_current_user_firebase)
):
    """Return dynamic interview cards based on user preferences."""
    db = get_db()
    user_doc = db.collection(Collections.USERS).document(current_user.id).get()
    preferences = None
    if user_doc.exists:
        user_data = user_doc.to_dict() or {}
        preferences = (user_data.get("profile") or {}).get("preferences")

    generator = AIContentGenerator()
    cards = generator.generate_mode_cards(preferences=preferences)
    return {"cards": cards}


@router.post("", status_code=status.HTTP_201_CREATED)
async def create_session(
    session_data: SessionCreate,
    current_user: User = Depends(get_current_user_firebase)
):
    """
    Create a new interview session
    
    Initializes session state machine and prepares for questions
    """
    db = get_db()
    
    # Validate mode
    try:
        mode = InterviewMode(session_data.mode)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid mode. Must be one of: {[m.value for m in InterviewMode]}"
        )
    
    # Validate difficulty
    if not 1 <= session_data.difficulty_start <= 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Difficulty must be between 1 and 5"
        )
    
    # Create session
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


@router.post("/{session_id}/start")
async def start_session(
    session_id: str,
    current_user: User = Depends(get_current_user_firebase)
):
    """
    Start the interview session
    
    Transitions from INIT to ASK_QUESTION state
    """
    db = get_db()
    session_doc = db.collection(Collections.SESSIONS).document(session_id).get()
    
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Transition state
    state_machine = SessionStateMachine(session)
    if not state_machine.transition(SessionState.ASK_QUESTION):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot start session from state {session.state.value}"
        )
    
    return {"status": "started", "state": SessionState.ASK_QUESTION.value}


@router.post("/{session_id}/questions/next")
async def get_next_question(
    session_id: str,
    current_user: User = Depends(get_current_user_firebase)
):
    """
    Get next question for the session
    
    Implements adaptive difficulty based on previous performance
    """
    db = get_db()
    session_doc = db.collection(Collections.SESSIONS).document(session_id).get()
    
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check if session can accept more questions
    if session.questions_count >= settings.MAX_QUESTIONS_PER_SESSION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum questions reached for this session"
        )
    
    # Generate question
    engine = InterviewEngine()
    question = engine.generate_next_question(session)
    
    return {
        "id": question.id,
        "question_text": question.question_text,
        "difficulty": question.difficulty
    }


@router.post("/{session_id}/questions/{question_id}/answer")
async def submit_answer(
    session_id: str,
    question_id: str,
    transcript: Optional[str] = Form(None),
    audio_duration_sec: Optional[float] = Form(None),
    audio_file: Optional[UploadFile] = File(None),
    current_user: User = Depends(require_audio_consent)
):
    """
    Submit answer for evaluation
    
    Accepts either transcript directly or audio file for transcription
    Returns AI evaluation with rubric scores
    """
    db = get_db()
    
    # Validate session
    session_doc = db.collection(Collections.SESSIONS).document(session_id).get()
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())
    if session.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail=(
                f"Not authorized for this session. "
                f"session_user_id={session.user_id}, current_user_id={current_user.id}"
            ),
        )
    
    # Get question
    question_doc = db.collection(Collections.SESSION_QUESTIONS).document(question_id).get()
    if not question_doc.exists:
        raise HTTPException(status_code=404, detail="Question not found")
    
    from src.db.models import SessionQuestion
    question = SessionQuestion.from_dict(question_doc.id, question_doc.to_dict())
    if question.session_id != session_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Question does not belong to this session",
        )
    
    # Get transcript
    clarity_score = None
    
    if not transcript and audio_file:
        # Transcribe audio
        stt_service = STTService()
        transcript = await stt_service.transcribe(audio_file)
        if audio_duration_sec:
            clarity_score = stt_service.calculate_clarity_score(
                transcript, audio_duration_sec
            )
    
    if not transcript:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either transcript or audio_file must be provided"
        )
    
    # Update question with transcript
    db.collection(Collections.SESSION_QUESTIONS).document(question_id).update({
        'transcript': transcript,
        'audio_duration_sec': audio_duration_sec,
        'clarity_score': clarity_score,
    })
    
    # Evaluate answer
    evaluator = AIEvaluatorService()
    evaluation = await evaluator.evaluate_answer(session, question, transcript)
    
    # Save evaluation
    eval_ref = db.collection(Collections.EVALUATIONS).document()
    evaluation.id = eval_ref.id
    eval_ref.set(evaluation.to_dict())
    
    return {
        "transcript": transcript,
        "clarity_score": clarity_score,
        "clarity_ok": (
            clarity_score is None or clarity_score >= settings.AUDIO_QUALITY_THRESHOLD
        ),
        "composite_score": evaluation.composite_score,
        "strengths": evaluation.strengths,
        "improvements": evaluation.improvements,
        "next_question_strategy": evaluation.next_question_strategy,
        "dimension_scores": {
            "dimension_1": evaluation.score_dimension_1,
            "dimension_2": evaluation.score_dimension_2,
            "dimension_3": evaluation.score_dimension_3,
            "dimension_4": evaluation.score_dimension_4,
            "dimension_5": evaluation.score_dimension_5,
        },
        "eval_confidence": evaluation.eval_confidence
    }


@router.get("/{session_id}/summary")
async def get_session_summary(
    session_id: str,
    current_user: User = Depends(get_current_user_firebase)
):
    """
    Get comprehensive session summary
    
    Includes scores, trends, strengths, improvements, and action plan
    """
    db = get_db()
    session_doc = db.collection(Collections.SESSIONS).document(session_id).get()
    
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    engine = InterviewEngine()
    summary = engine.generate_summary(session)
    
    return summary


@router.post("/{session_id}/complete")
async def complete_session(
    session_id: str,
    current_user: User = Depends(get_current_user_firebase)
):
    """
    Mark session as complete
    
    Finalizes session and calculates final metrics
    """
    db = get_db()
    session_doc = db.collection(Collections.SESSIONS).document(session_id).get()
    
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Complete session
    state_machine = SessionStateMachine(session)
    if not state_machine.complete():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Cannot complete session from state {session.state.value}"
        )
    
    return {"status": "completed", "session_id": session_id}


@router.get("")
async def list_sessions(
    current_user: User = Depends(get_current_user_firebase),
    limit: int = 10
):
    """List user's interview sessions"""
    from google.cloud import firestore
    db = get_db()
    sessions = (
        db.collection(Collections.SESSIONS)
        .where('user_id', '==', current_user.id)
        .order_by('created_at', direction=firestore.Query.DESCENDING)
        .limit(limit)
        .get()
    )
    
    result = []
    for session_doc in sessions:
        session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())
        result.append({
            "id": session.id,
            "mode": session.mode.value,
            "state": session.state.value,
            "total_score": session.total_score,
            "questions_count": session.questions_count,
            "created_at": session.created_at,
            "completed_at": session.completed_at
        })
    
    return {"sessions": result, "total": len(result)}
