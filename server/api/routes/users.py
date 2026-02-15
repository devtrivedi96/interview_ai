"""
User routes (Firebase version)
"""
from fastapi import APIRouter, Depends

from db.firebase import get_db
from db.models_firebase import User, InterviewSession, AnswerEvaluation, SessionQuestion
from schemas.auth import UserResponse
from core.security import get_current_user

router = APIRouter()


@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return UserResponse(id=current_user.id, email=current_user.email)


@router.get("/me/progress")
async def get_user_progress(
    current_user: User = Depends(get_current_user)
):
    """Get user progress and statistics"""
    db = get_db()
    
    # Get last 10 sessions
    sessions = db.collection('sessions')\
        .where('user_id', '==', current_user.id)\
        .order_by('created_at', direction='DESCENDING')\
        .limit(10)\
        .get()
    
    session_data = []
    for session_doc in sessions:
        session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())
        
        # Get all questions for this session
        questions = db.collection('session_questions')\
            .where('session_id', '==', session.id)\
            .get()
        
        # Calculate average score
        total_score = 0
        count = 0
        for q_doc in questions:
            q = SessionQuestion.from_dict(q_doc.id, q_doc.to_dict())
            # Get evaluation
            evals = db.collection('answer_evaluations')\
                .where('session_question_id', '==', q.id)\
                .limit(1)\
                .get()
            
            for e_doc in evals:
                eval_data = AnswerEvaluation.from_dict(e_doc.id, e_doc.to_dict())
                total_score += eval_data.composite_score
                count += 1
        
        avg_score = total_score / count if count > 0 else 0
        
        session_data.append({
            "session_id": session.id,
            "mode": session.mode.value,
            "created_at": session.created_at.isoformat() if session.created_at else None,
            "average_score": round(avg_score, 2)
        })
    
    return {
        "sessions": session_data,
        "total_sessions": len(session_data)
    }
