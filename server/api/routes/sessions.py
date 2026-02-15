"""
Interview session routes (Firebase version)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime

from db.firebase import get_db
from db.models_firebase import User, InterviewSession, SessionQuestion, SessionState, InterviewMode
from schemas.session import (
    SessionCreate, SessionResponse, QuestionResponse, 
    AnswerSubmit, EvaluationResponse, SessionSummary
)
from core.security import get_current_user
from services.interview_engine_firebase import InterviewEngine
from services.ai_evaluator_firebase import AIEvaluator

router = APIRouter()


@router.post("", response_model=SessionResponse, status_code=status.HTTP_201_CREATED)
async def create_session(
    session_data: SessionCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new interview session"""
    db = get_db()
    sessions_ref = db.collection('sessions')
    session_ref = sessions_ref.document()
    
    session = InterviewSession(
        id=session_ref.id,
        user_id=current_user.id,
        mode=InterviewMode(session_data.mode),
        difficulty_start=session_data.difficulty_start,
        state=SessionState.INIT
    )
    session_ref.set(session.to_dict())
    
    return SessionResponse(
        id=session.id,
        mode=session.mode.value,
        difficulty_start=session.difficulty_start,
        state=session.state.value,
        created_at=session.created_at
    )


@router.post("/{session_id}/questions/next", response_model=QuestionResponse)
async def get_next_question(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get next question for the session"""
    db = get_db()
    session_doc = db.collection('sessions').document(session_id).get()
    
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    engine = InterviewEngine(db)
    question = engine.generate_next_question(session)
    
    return QuestionResponse(
        id=question.id,
        question_text=question.question_text,
        difficulty=question.difficulty
    )


@router.post("/{session_id}/answers", response_model=EvaluationResponse)
async def submit_answer(
    session_id: str,
    answer_data: AnswerSubmit,
    current_user: User = Depends(get_current_user)
):
    """Submit answer and get evaluation"""
    db = get_db()
    session_doc = db.collection('sessions').document(session_id).get()
    
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Get latest question
    questions = db.collection('session_questions')\
        .where('session_id', '==', session_id)\
        .order_by('created_at', direction='DESCENDING')\
        .limit(1)\
        .get()
    
    questions_list = list(questions)
    if not questions_list:
        raise HTTPException(status_code=400, detail="No active question")
    
    question_doc = questions_list[0]
    question = SessionQuestion.from_dict(question_doc.id, question_doc.to_dict())
    
    # Update transcript
    question.transcript = answer_data.transcript
    db.collection('session_questions').document(question.id).update({
        'transcript': answer_data.transcript
    })
    
    # Evaluate answer
    evaluator = AIEvaluator()
    evaluation = evaluator.evaluate_answer(session, question, answer_data.transcript)
    
    # Save evaluation
    eval_ref = db.collection('answer_evaluations').document()
    evaluation.id = eval_ref.id
    eval_ref.set(evaluation.to_dict())
    
    return EvaluationResponse(
        composite_score=evaluation.composite_score,
        strengths=evaluation.strengths_json,
        improvements=evaluation.improvements_json,
        dimension_scores={
            "dimension_1": evaluation.score_dimension_1,
            "dimension_2": evaluation.score_dimension_2,
            "dimension_3": evaluation.score_dimension_3,
            "dimension_4": evaluation.score_dimension_4,
            "dimension_5": evaluation.score_dimension_5,
        }
    )


@router.get("/{session_id}/summary", response_model=SessionSummary)
async def get_session_summary(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get session summary and analytics"""
    db = get_db()
    session_doc = db.collection('sessions').document(session_id).get()
    
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    engine = InterviewEngine(db)
    summary = engine.generate_summary(session)
    
    return summary


@router.post("/{session_id}/complete")
async def complete_session(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark session as complete"""
    db = get_db()
    session_doc = db.collection('sessions').document(session_id).get()
    
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    db.collection('sessions').document(session_id).update({
        'state': SessionState.COMPLETE.value,
        'completed_at': datetime.utcnow()
    })
    
    return {"status": "completed"}
