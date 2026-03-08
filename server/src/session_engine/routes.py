"""
Session management routes
Handles interview session lifecycle
"""

import logging
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

logger = logging.getLogger(__name__)

from src.db.aws_client import get_db, Collections
from src.db.models import (
    User,
    InterviewSession,
    SessionState,
    InterviewMode,
    SessionQuestion,
    AnswerEvaluation,
)
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

# Shared services
stt_service = STTService()
ai_evaluator = AIEvaluatorService()
engine = InterviewEngine()


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

    # Determine primary language from user preferences (if any)
    user_doc = db.collection(Collections.USERS).document(current_user.id).get()
    primary_language = None
    preferred_roles = []
    if user_doc.exists:
        user_data = user_doc.to_dict() or {}
        preferences = (user_data.get("profile") or {}).get("preferences") or {}
        tech_stack = preferences.get("tech_stack") or []
        if isinstance(tech_stack, list) and tech_stack:
            primary_language = str(tech_stack[0])
        preferred_roles = preferences.get("preferred_roles") or []

    # 🔥 Generate First Question Using Bedrock with single retry
    question_text = None
    max_retries = 1  # Reduced from 2 to reduce API calls
    
    for attempt in range(max_retries):
        try:
            question_text = bedrock.generate_question(
                mode=session.mode.value,
                difficulty=session.difficulty_current,
                language=primary_language,
                preferred_roles=preferred_roles,
            )
            if question_text and question_text.strip():
                break
            else:
                raise Exception("Empty question generated")
        except Exception as gen_err:
            logger.warning(f"First question generation attempt {attempt + 1} failed: {str(gen_err)}")
            if attempt == max_retries - 1:
                raise
    
    if not question_text or not question_text.strip():
        raise HTTPException(status_code=500, detail="Failed to generate first question")

    question_ref = db.collection(Collections.SESSION_QUESTIONS).document()

    question_ref.set({
        "session_id": session.id,
        "question_text": question_text.strip(),
        "difficulty": session.difficulty_current,
        "question_number": 1,
        "created_at": datetime.utcnow()
    })

    # Update question count to 1
    db.collection(Collections.SESSIONS).document(session.id).update({
        "questions_count": 1,
        "state": SessionState.ASK_QUESTION.value
    })

    logger.info(f"Session {session_id} started with first question")

    return {
        "status": "started",
        "question_id": question_ref.id,
        "question_text": question_text.strip(),
        "difficulty": session.difficulty_current,
        "questions_count": 1,
        "question_number": 1
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

    # Use the questions_count stored on session (more efficient than querying all)
    actual_count = session.questions_count or 0
    
    if actual_count >= settings.MAX_QUESTIONS_PER_SESSION:
        logger.warning(f"Session {session_id} reached max questions: {actual_count}")
        raise HTTPException(
            status_code=400,
            detail=f"Maximum questions reached ({settings.MAX_QUESTIONS_PER_SESSION})"
        )

    try:
        # Determine primary language from user preferences (if any)
        user_doc = db.collection(Collections.USERS).document(current_user.id).get()
        primary_language = None
        preferred_roles = []
        if user_doc.exists:
            user_data = user_doc.to_dict() or {}
            preferences = (user_data.get("profile") or {}).get("preferences") or {}
            tech_stack = preferences.get("tech_stack") or []
            if isinstance(tech_stack, list) and tech_stack:
                primary_language = str(tech_stack[0])
            preferred_roles = preferences.get("preferred_roles") or []

        # 🔥 Generate next question using Bedrock with minimal retry
        max_retries = 1  # Single attempt for subsequent questions to reduce API calls
        question_text = None
        
        for attempt in range(max_retries):
            try:
                question_text = bedrock.generate_question(
                    mode=session.mode.value,
                    difficulty=session.difficulty_current,
                    language=primary_language,
                    preferred_roles=preferred_roles,
                )
                if question_text and question_text.strip():
                    break  # Success - got a valid question
                else:
                    raise Exception("Empty question generated")
            except Exception as gen_err:
                logger.warning(f"Question generation attempt {attempt + 1} failed: {str(gen_err)}")
                if attempt == max_retries - 1:
                    raise  # Re-raise on final attempt

        if not question_text or not question_text.strip():
            raise Exception("Failed to generate valid question after retries")

        # Create question document with unique ID and timestamp for ordering
        question_ref = db.collection(Collections.SESSION_QUESTIONS).document()
        question_doc_data = {
            "session_id": session.id,
            "question_text": question_text.strip(),
            "difficulty": session.difficulty_current,
            "question_number": actual_count + 1,  # Sequential number
            "created_at": datetime.utcnow()
        }
        question_ref.set(question_doc_data)

        # Update session questions count atomically
        new_count = actual_count + 1
        db.collection(Collections.SESSIONS).document(session.id).update({
            "questions_count": new_count
        })

        logger.info(f"Generated question {new_count} for session {session_id}")

        return {
            "question_id": question_ref.id,
            "question_text": question_text.strip(),
            "difficulty": session.difficulty_current,
            "questions_count": new_count,
            "question_number": new_count
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error generating next question (all retries exhausted): {str(e)}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to generate question: {str(e)}")


# ==============================
# GET INTERVIEW MODE CARDS
# ==============================

@router.get("/modes/cards")
async def get_interview_cards(
    current_user: User = Depends(get_current_user_firebase),
):
    """Get interview mode cards.

    Always returns the four default modes (DSA, HR, BEHAVIORAL, SYSTEM_DESIGN)
    and, when possible, enriches them using the user's preferences via
    AIContentGenerator. If AI suggests additional modes, they are appended as
    extra options.
    """

    # 1) Start with the static default cards (these must always exist)
    cards: list[dict] = []
    for mode in InterviewMode:
        cards.append(
            {
                "id": mode.value,
                "key": mode.value,
                "mode": mode.value,
                "title": mode.value.replace("_", " ").title(),
                "description": f"Practice {mode.value.replace('_', ' ')} interviews",
                "iconColor": "blue",
                "source": "default",
            }
        )

    # 2) Try to append AI-powered extra tracks using preferences
    try:
        db = get_db()
        user_doc = db.collection(Collections.USERS).document(current_user.id).get()
        preferences = None
        if user_doc.exists:
            user_data = user_doc.to_dict() or {}
            preferences = (user_data.get("profile") or {}).get("preferences")

        generator = AIContentGenerator()
        ai_cards = generator.generate_mode_cards(preferences=preferences) or []

        # Allow only known interview modes as underlying types
        valid_modes = {m.value for m in InterviewMode}
        idx = 0
        for c in ai_cards:
            mode_val = str(c.get("mode") or "").upper()
            if not mode_val or mode_val not in valid_modes:
                continue

            idx += 1
            title = c.get("title") or mode_val.title()
            desc = c.get("description") or "Practice this interview type."
            cards.append(
                {
                    # Use a unique key/id but keep the canonical mode
                    "id": f"{mode_val}_AI_{idx}",
                    "key": f"{mode_val}_AI_{idx}",
                    "mode": mode_val,
                    "title": title,
                    "description": desc,
                    "iconColor": "blue",
                    "source": "ai-extra",
                }
            )
    except Exception:
        # On any AI / preference error, we simply return the defaults above
        pass

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
            "questions_count": session.questions_count,
            "total_score": session_data.get("total_score")  # Include the final score
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
    """Get AI-evaluated session summary.

    This uses the InterviewEngine to aggregate all AnswerEvaluation
    documents for the session and returns a rich summary that is
    compatible with both the new Interview view and the legacy
    SessionSummary page.
    """
    db = get_db()

    session_doc = db.collection(Collections.SESSIONS).document(session_id).get()
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")

    session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())

    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Core engine-generated summary (0-5 scoring)
    summary_core = engine.generate_summary(session)

    total_score = summary_core.get("total_score") or 0.0
    dimension_averages = summary_core.get("dimension_averages") or {}
    strengths = summary_core.get("strengths") or []
    improvements = summary_core.get("improvements") or []
    action_plan = summary_core.get("action_plan") or []
    duration_sec = summary_core.get("duration_sec") or session.duration_sec or 0

    # Derive percent-based scores for the older summary UI
    overall_score_pct = round((total_score / 5.0) * 100) if total_score else 0

    # Map rubric dimensions to rough technical vs communication buckets
    tech_dims = [
        v for k, v in dimension_averages.items() if k != "dimension_5" and v is not None
    ]
    comm_dim = dimension_averages.get("dimension_5")

    technical_avg = (
        sum(tech_dims) / len(tech_dims)
        if tech_dims
        else total_score
    ) or 0.0
    communication_avg = comm_dim or total_score or 0.0

    technical_score_pct = round((technical_avg / 5.0) * 100) if technical_avg else 0
    communication_score_pct = (
        round((communication_avg / 5.0) * 100) if communication_avg else 0
    )

    # Format duration as MM:SS string for the frontend
    duration_str = None
    try:
        total_seconds = int(duration_sec or 0)
        minutes, seconds = divmod(total_seconds, 60)
        duration_str = f"{minutes:02d}:{seconds:02d}"
    except Exception:
        duration_str = "00:00"

    # Build feedback/suggestions structures expected by SessionSummary.jsx
    feedback = []
    if strengths:
        feedback.append({
            "category": "Strengths",
            "comment": " ".join(strengths),
        })
    if improvements:
        feedback.append({
            "category": "Improvements",
            "comment": " ".join(improvements),
        })

    suggestions = [
        {"title": f"Step {idx + 1}", "description": step}
        for idx, step in enumerate(action_plan)
    ]

    return {
        # Base session info
        "id": session.id,
        "mode": session.mode.value,
        "difficulty_start": session.difficulty_start,
        "difficulty_current": session.difficulty_current,
        "state": session.state.value,
        "questions_count": summary_core.get("questions_count", session.questions_count),
        "created_at": session.created_at,

        # Engine summary (used by Interview.jsx)
        "total_score": total_score,
        "dimension_averages": dimension_averages,
        "strengths": strengths,
        "improvements": improvements,
        "difficulty_progression": summary_core.get("difficulty_progression"),
        "action_plan": action_plan,
        "duration_sec": duration_sec,

        # Legacy/percent-based fields (used by SessionSummary.jsx)
        "overall_score": overall_score_pct,
        "technical_score": technical_score_pct,
        "communication_score": communication_score_pct,
        "duration": duration_str,
        "feedback": feedback,
        "suggestions": suggestions,
    }


# ==============================
# GET DETAILED Q&A HISTORY
# ==============================

@router.get("/{session_id}/qa-history")
async def get_qa_history(
    session_id: str,
    current_user: User = Depends(get_current_user_firebase)
):
    """Get detailed Q&A history with evaluations for a session.
    
    Returns all questions, user answers, and evaluation feedback
    for review and learning purposes.
    """
    db = get_db()

    session_doc = db.collection(Collections.SESSIONS).document(session_id).get()
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")

    session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())

    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    try:
        # Fetch all questions for this session, ordered by creation
        questions_docs = list(
            db.collection(Collections.SESSION_QUESTIONS)
            .where("session_id", "==", session_id)
            .stream()
        )

        # Convert to list and deduplicate based on question_text (in case same question generated)
        questions_list = []
        seen_texts = set()
        question_ids = []
        
        for q_doc in questions_docs:
            q_data = q_doc.to_dict()
            question_text = q_data.get("question_text", "").strip()
            question_id = q_doc.id
            
            # Deduplicate: skip if we've already seen this exact question text
            if question_text in seen_texts:
                logger.warning(f"Skipping duplicate question in session {session_id}: {question_text[:50]}...")
                continue
            
            seen_texts.add(question_text)
            question_ids.append(question_id)
            questions_list.append((question_id, q_data))

        # Batch fetch all answers for these questions (avoid N+1)
        all_answers = {}
        if question_ids:
            answers_docs = list(
                db.collection(Collections.ANSWERS)
                .where("question_id", "in", question_ids if len(question_ids) == 1 else None)
                .stream()
            ) if len(question_ids) == 1 else []
            
            # For multiple questions, fetch all and filter
            if len(question_ids) > 1:
                all_answers_raw = list(db.collection(Collections.ANSWERS).stream())
                answers_docs = [a for a in all_answers_raw if a.to_dict().get('question_id') in question_ids]
            
            answer_ids = []
            for a_doc in answers_docs:
                a_data = a_doc.to_dict()
                q_id = a_data.get('question_id')
                all_answers[q_id] = (a_doc.id, a_data)
                answer_ids.append(a_doc.id)

        # Batch fetch all evaluations for these answers (avoid N+1)
        all_evaluations = {}
        if answer_ids:
            evals_docs = list(
                db.collection(Collections.EVALUATIONS)
                .where("answer_id", "in", answer_ids if len(answer_ids) == 1 else None)
                .stream()
            ) if len(answer_ids) == 1 else []
            
            # For multiple answers, fetch all and filter
            if len(answer_ids) > 1:
                all_evals_raw = list(db.collection(Collections.EVALUATIONS).stream())
                evals_docs = [e for e in all_evals_raw if e.to_dict().get('answer_id') in answer_ids]
            
            for e_doc in evals_docs:
                e_data = e_doc.to_dict()
                answer_id = e_data.get('answer_id')
                all_evaluations[answer_id] = e_data

        # Build QA items from batched data
        qa_items = []
        for idx, (question_id, q_data) in enumerate(questions_list, 1):
            user_answer = None
            evaluation = None
            
            if question_id in all_answers:
                answer_id, a_data = all_answers[question_id]
                # The stored field is 'transcript', not 'answer_text'
                user_answer = a_data.get("transcript") or a_data.get("answer_text")
                
                # Get evaluation if it exists
                if answer_id in all_evaluations:
                    e_data = all_evaluations[answer_id]
                    evaluation = {
                        "score": e_data.get("score"),
                        "feedback": e_data.get("feedback"),
                        "strengths": e_data.get("strengths", []),
                        "improvements": e_data.get("improvements", []),
                        "expected_answer": e_data.get("expected_answer"),
                    }
            
            qa_items.append({
                "question_number": idx,
                "question_id": question_id,
                "question_text": q_data.get("question_text"),
                "difficulty": q_data.get("difficulty"),
                "user_answer": user_answer,
                "expected_answer": evaluation.get("expected_answer") if evaluation else None,
                "evaluation": evaluation,
            })

        logger.info(f"Fetched {len(qa_items)} unique questions from {len(questions_list)} total for session {session_id}")

        return {
            "session_id": session_id,
            "mode": session.mode.value,
            "difficulty_start": session.difficulty_start,
            "created_at": session.created_at,
            "qa_items": qa_items,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching QA history: {str(e)}", exc_info=True)
        # Return empty list on error instead of failing
        return {
            "session_id": session_id,
            "mode": session.mode.value,
            "difficulty_start": session.difficulty_start,
            "created_at": session.created_at,
            "qa_items": [],
            "error": "Could not load detailed Q&A history"
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
    """Submit answer for a question and evaluate it with AI.

    The flow is:
    - Validate session & question
    - Transcribe audio if needed (via STTService)
    - Persist raw answer in the ANSWERS collection
    - Run AI evaluation (AIEvaluatorService) and store in EVALUATIONS
    - Return structured evaluation payload used by the frontend
    """
    db = get_db()

    session_doc = db.collection(Collections.SESSIONS).document(session_id).get()
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")

    session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())

    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")

    # Fetch question context
    question_doc = db.collection(Collections.SESSION_QUESTIONS).document(question_id).get()
    if not question_doc.exists:
        raise HTTPException(status_code=404, detail="Question not found")

    session_question = SessionQuestion.from_dict(question_doc.id, question_doc.to_dict())

    # Derive final transcript: either provided directly or via STT
    final_transcript: Optional[str] = None

    if transcript and transcript.strip():
        final_transcript = transcript.strip()
    elif audio_file is not None:
        # Use STT to get transcript from audio
        final_transcript = (await stt_service.transcribe(audio_file)).strip()
    else:
        raise HTTPException(status_code=400, detail="No answer provided (audio or transcript required)")

    # Calculate speech clarity if we have audio duration
    clarity_score = None
    if audio_duration_sec is not None:
        try:
            clarity_score = stt_service.calculate_clarity_score(
                final_transcript,
                float(audio_duration_sec) if audio_duration_sec else 0.0,
            )
        except Exception:
            clarity_score = None

    # Store raw answer
    answer_ref = db.collection(Collections.ANSWERS).document()
    answer_ref.set(
        {
            "session_id": session_id,
            "question_id": question_id,
            "transcript": final_transcript,
            "audio_duration_sec": audio_duration_sec,
            "clarity_score": clarity_score,
            "created_at": datetime.utcnow(),
        }
    )

    # Update session question with transcript/clarity for later analytics
    db.collection(Collections.SESSION_QUESTIONS).document(question_id).update(
        {
            "transcript": final_transcript,
            "audio_duration_sec": audio_duration_sec,
            "clarity_score": clarity_score,
        }
    )

    # Run AI evaluation for this answer
    try:
        evaluation: AnswerEvaluation = await ai_evaluator.evaluate_answer(
            session=session,
            question=session_question,
            transcript=final_transcript,
        )

        # Persist evaluation with reference to the answer
        eval_ref = db.collection(Collections.EVALUATIONS).document()
        evaluation.id = eval_ref.id
        eval_dict = evaluation.to_dict()
        eval_dict["answer_id"] = answer_ref.id  # Store reference to answer
        eval_ref.set(eval_dict)

        dimension_scores = {
            "dimension_1": evaluation.score_dimension_1,
            "dimension_2": evaluation.score_dimension_2,
            "dimension_3": evaluation.score_dimension_3,
            "dimension_4": evaluation.score_dimension_4,
            "dimension_5": evaluation.score_dimension_5,
        }

        return {
            "answer_id": answer_ref.id,
            "status": "evaluated",
            "session_id": session_id,
            "question_id": question_id,
            "transcript": final_transcript,
            "questions_count": session.questions_count,
            "composite_score": evaluation.composite_score,
            "dimension_scores": dimension_scores,
            "strengths": evaluation.strengths,
            "improvements": evaluation.improvements,
            "next_question_strategy": evaluation.next_question_strategy,
            "eval_confidence": evaluation.eval_confidence,
            "clarity_score": clarity_score,
            "clarity_ok": clarity_score is None or clarity_score >= 0.5,
        }
    except Exception as e:
        # If evaluation fails, we still keep the raw answer and
        # return a graceful response so the frontend can show an error.
        logger = __import__("logging").getLogger(__name__)
        logger.error(f"AI evaluation failed: {e}")
        return {
            "answer_id": answer_ref.id,
            "status": "received",
            "session_id": session_id,
            "question_id": question_id,
            "transcript": final_transcript,
            "questions_count": session.questions_count,
            "composite_score": 0.0,
            "strengths": [
                "Answer recorded successfully, but automatic evaluation is temporarily unavailable.",
            ],
            "improvements": [],
            "eval_confidence": 0.0,
            "clarity_score": clarity_score,
            "clarity_ok": clarity_score is None or clarity_score >= 0.5,
        }


# ==============================
# COMPLETE SESSION
# ==============================

@router.post("/{session_id}/complete")
async def complete_session(
    session_id: str,
    current_user: User = Depends(get_current_user_firebase)
):
    """Complete a session and calculate final score"""
    db = get_db()
    
    session_doc = db.collection(Collections.SESSIONS).document(session_id).get()
    if not session_doc.exists:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = InterviewSession.from_dict(session_doc.id, session_doc.to_dict())
    
    if session.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Generate final summary with scores
    summary_core = engine.generate_summary(session)
    total_score = summary_core.get("total_score") or 0.0
    
    # Update session state and store final score
    db.collection(Collections.SESSIONS).document(session_id).update({
        "state": SessionState.COMPLETE.value,
        "completed_at": datetime.utcnow(),
        "total_score": float(total_score)
    })
    
    return {
        "status": "completed",
        "session_id": session_id,
        "total_score": total_score
    }
