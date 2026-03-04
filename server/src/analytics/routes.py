"""
Analytics routes
Provides metrics and insights on user performance
"""
from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from typing import Optional

from src.db.firebase_client import get_db, Collections
from src.db.models import User, InterviewSession
from src.auth.security import get_current_user_firebase

router = APIRouter()


@router.get("/progress")
async def get_user_progress(
    current_user: User = Depends(get_current_user_firebase),
    limit: int = 10
):
    """
    Get user progress and statistics
    
    Returns:
        - Recent sessions with scores
        - Average scores by mode
        - Improvement trends
    """
    from google.cloud import firestore
    db = get_db()
    sessions = db.collection(Collections.SESSIONS)\
        .where('user_id', '==', current_user.id)\
        .order_by('created_at', direction=firestore.Query.DESCENDING)\
        .limit(limit)\
        .get()
    
    session_data = []
    scores_by_mode = {}
    
    for session_doc in sessions:
        session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())
        
        session_data.append({
            "session_id": session.id,
            "mode": session.mode.value,
            "created_at": session.created_at,
            "total_score": session.total_score,
            "questions_count": session.questions_count,
            "state": session.state.value
        })
        
        # Aggregate by mode
        if session.total_score is not None:
            mode_key = session.mode.value
            if mode_key not in scores_by_mode:
                scores_by_mode[mode_key] = []
            scores_by_mode[mode_key].append(session.total_score)
    
    # Calculate averages by mode
    mode_averages = {}
    for mode, scores in scores_by_mode.items():
        if scores:
            mode_averages[mode] = {
                "average_score": round(sum(scores) / len(scores), 2),
                "sessions_count": len(scores),
                "latest_score": scores[0] if scores else None
            }
    
    return {
        "sessions": session_data,
        "total_sessions": len(session_data),
        "mode_statistics": mode_averages
    }


@router.get("/insights")
async def get_insights(
    current_user: User = Depends(get_current_user_firebase),
    days: int = 30
):
    """
    Get detailed insights and trends
    
    Args:
        days: Number of days to analyze
    
    Returns:
        - Improvement trends
        - Strengths and weaknesses
        - Recommended focus areas
    """
    from google.cloud import firestore
    db = get_db()
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    sessions = db.collection(Collections.SESSIONS)\
        .where('user_id', '==', current_user.id)\
        .where('created_at', '>=', cutoff_date)\
        .order_by('created_at', direction=firestore.Query.ASCENDING)\
        .get()
    
    scores_over_time = []
    all_strengths = []
    all_improvements = []
    session_ids = []
    question_ids = []
    
    # First pass: collect session scores and IDs (avoids N+1 queries)
    for session_doc in sessions:
        session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())
        session_ids.append(session.id)
        
        if session.total_score is not None:
            scores_over_time.append({
                "date": session.created_at,
                "score": session.total_score,
                "mode": session.mode.value
            })
    
    # Second pass: fetch all session questions for these sessions
    if session_ids:
        question_docs_raw = list(db.collection(Collections.SESSION_QUESTIONS).get())
        question_docs = [q for q in question_docs_raw if q.to_dict().get('session_id') in session_ids]
        question_ids = [q.id for q in question_docs]
    
    # Third pass: fetch all evaluations for these questions
    if question_ids:
        eval_docs_raw = list(db.collection(Collections.EVALUATIONS).get())
        all_evaluations = [e for e in eval_docs_raw if e.to_dict().get('session_question_id') in question_ids]
        
        for e_doc in all_evaluations:
            eval_data = e_doc.to_dict()
            strengths = eval_data.get('strengths', []) or []
            improvements = eval_data.get('improvements', []) or []
            
            # Filter out error messages and fallback placeholder text
            all_strengths.extend([
                s for s in strengths 
                if s and "Answer recorded successfully" not in s and "temporarily unavailable" not in s
            ])
            all_improvements.extend([
                i for i in improvements 
                if i and "temporarily unavailable" not in i and "please try again" not in i
            ])
    
    # Calculate trend
    trend = "stable"
    if len(scores_over_time) >= 3:
        recent_avg = sum(s['score'] for s in scores_over_time[-3:]) / 3
        older_avg = sum(s['score'] for s in scores_over_time[:3]) / 3
        
        if recent_avg > older_avg + 0.3:
            trend = "improving"
        elif recent_avg < older_avg - 0.3:
            trend = "declining"
    
    # Find common themes
    from collections import Counter
    common_strengths = [item for item, count in Counter(all_strengths).most_common(5)]
    common_improvements = [item for item, count in Counter(all_improvements).most_common(5)]
    
    return {
        "period_days": days,
        "total_sessions": len(scores_over_time),
        "trend": trend,
        "scores_over_time": scores_over_time,
        "common_strengths": common_strengths,
        "common_improvements": common_improvements,
        "recommended_focus": common_improvements[:3] if common_improvements else []
    }


@router.get("/leaderboard")
async def get_leaderboard(
    mode: Optional[str] = None,
    limit: int = 10
):
    """
    Get leaderboard (anonymized)
    
    Shows top performers by mode
    """
    db = get_db()
    
    # Get all completed sessions
    query = db.collection(Collections.SESSIONS)\
        .where('state', '==', 'COMPLETE')
    
    if mode:
        query = query.where('mode', '==', mode)
    
    sessions = (
        query.order_by('total_score', direction='DESCENDING')
        .limit(limit)
        .get()
    )
    
    leaderboard = []
    for i, session_doc in enumerate(sessions, 1):
        session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())
        
        leaderboard.append({
            "rank": i,
            "score": session.total_score,
            "mode": session.mode.value,
            "questions_count": session.questions_count,
            "user_id_hash": hash(session.user_id) % 10000  # Anonymized
        })
    
    return {
        "leaderboard": leaderboard,
        "mode": mode or "all"
    }
