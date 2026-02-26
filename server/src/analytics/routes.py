"""
Analytics routes
Provides metrics and insights on user performance
"""
from fastapi import APIRouter, Depends
from datetime import datetime, timedelta
from typing import Optional

from db.firebase_client import get_db, Collections
from db.models import User, InterviewSession
from auth.security import get_current_user_firebase

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
    db = get_db()
    
    # Get recent sessions
    sessions = db.collection(Collections.SESSIONS)\
        .where('user_id', '==', current_user.id)\
        .order_by('created_at', direction='DESCENDING')\
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
    db = get_db()
    
    # Get sessions from last N days
    cutoff_date = datetime.utcnow() - timedelta(days=days)
    
    sessions = db.collection(Collections.SESSIONS)\
        .where('user_id', '==', current_user.id)\
        .where('created_at', '>=', cutoff_date)\
        .order_by('created_at', direction='ASCENDING')\
        .get()
    
    scores_over_time = []
    all_strengths = []
    all_improvements = []
    
    for session_doc in sessions:
        session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())
        
        if session.total_score is not None:
            scores_over_time.append({
                "date": session.created_at,
                "score": session.total_score,
                "mode": session.mode.value
            })
        
        # Get evaluations for this session
        questions = db.collection(Collections.SESSION_QUESTIONS)\
            .where('session_id', '==', session.id)\
            .get()
        
        for q_doc in questions:
            evals = db.collection(Collections.EVALUATIONS)\
                .where('session_question_id', '==', q_doc.id)\
                .limit(1)\
                .get()
            
            for e_doc in evals:
                eval_data = e_doc.to_dict()
                all_strengths.extend(eval_data.get('strengths', []))
                all_improvements.extend(eval_data.get('improvements', []))
    
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
    
    sessions = query.order_by('total_score', direction='DESCENDING')\
        .limit(limit)\
        .get()
    
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
