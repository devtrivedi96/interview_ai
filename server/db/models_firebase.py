"""
Firebase data models and helpers
"""
from datetime import datetime
from typing import Optional, Dict, Any
from enum import Enum


class InterviewMode(str, Enum):
    DSA = "DSA"
    HR = "HR"


class SessionState(str, Enum):
    IDLE = "IDLE"
    INIT = "INIT"
    ASK_QUESTION = "ASK_QUESTION"
    CAPTURE_AUDIO = "CAPTURE_AUDIO"
    TRANSCRIBE = "TRANSCRIBE"
    EVALUATE = "EVALUATE"
    DELIVER_FEEDBACK = "DELIVER_FEEDBACK"
    ADAPT = "ADAPT"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"


class User:
    """User model"""
    def __init__(self, id: str, email: str, hashed_password: str, created_at: datetime = None):
        self.id = id
        self.email = email
        self.hashed_password = hashed_password
        self.created_at = created_at or datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "email": self.email,
            "hashed_password": self.hashed_password,
            "created_at": self.created_at
        }
    
    @staticmethod
    def from_dict(id: str, data: Dict[str, Any]) -> 'User':
        return User(
            id=id,
            email=data.get("email"),
            hashed_password=data.get("hashed_password"),
            created_at=data.get("created_at")
        )


class InterviewSession:
    """Interview session model"""
    def __init__(
        self,
        id: str,
        user_id: str,
        mode: InterviewMode,
        difficulty_start: int = 3,
        difficulty_end: Optional[int] = None,
        total_score: Optional[float] = None,
        duration_sec: Optional[int] = None,
        state: SessionState = SessionState.INIT,
        created_at: datetime = None,
        completed_at: Optional[datetime] = None
    ):
        self.id = id
        self.user_id = user_id
        self.mode = mode
        self.difficulty_start = difficulty_start
        self.difficulty_end = difficulty_end
        self.total_score = total_score
        self.duration_sec = duration_sec
        self.state = state
        self.created_at = created_at or datetime.utcnow()
        self.completed_at = completed_at
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "mode": self.mode.value if isinstance(self.mode, InterviewMode) else self.mode,
            "difficulty_start": self.difficulty_start,
            "difficulty_end": self.difficulty_end,
            "total_score": self.total_score,
            "duration_sec": self.duration_sec,
            "state": self.state.value if isinstance(self.state, SessionState) else self.state,
            "created_at": self.created_at,
            "completed_at": self.completed_at
        }
    
    @staticmethod
    def from_dict(id: str, data: Dict[str, Any]) -> 'InterviewSession':
        return InterviewSession(
            id=id,
            user_id=data.get("user_id"),
            mode=InterviewMode(data.get("mode")),
            difficulty_start=data.get("difficulty_start", 3),
            difficulty_end=data.get("difficulty_end"),
            total_score=data.get("total_score"),
            duration_sec=data.get("duration_sec"),
            state=SessionState(data.get("state", "INIT")),
            created_at=data.get("created_at"),
            completed_at=data.get("completed_at")
        )


class Question:
    """Question model"""
    def __init__(
        self,
        id: str,
        mode: InterviewMode,
        difficulty: int,
        question_text: str,
        reference_answer: Optional[str] = None,
        metadata: Optional[Dict] = None,
        created_at: datetime = None
    ):
        self.id = id
        self.mode = mode
        self.difficulty = difficulty
        self.question_text = question_text
        self.reference_answer = reference_answer
        self.metadata = metadata or {}
        self.created_at = created_at or datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "mode": self.mode.value if isinstance(self.mode, InterviewMode) else self.mode,
            "difficulty": self.difficulty,
            "question_text": self.question_text,
            "reference_answer": self.reference_answer,
            "metadata": self.metadata,
            "created_at": self.created_at
        }
    
    @staticmethod
    def from_dict(id: str, data: Dict[str, Any]) -> 'Question':
        return Question(
            id=id,
            mode=InterviewMode(data.get("mode")),
            difficulty=data.get("difficulty"),
            question_text=data.get("question_text"),
            reference_answer=data.get("reference_answer"),
            metadata=data.get("metadata", {}),
            created_at=data.get("created_at")
        )


class SessionQuestion:
    """Session question model"""
    def __init__(
        self,
        id: str,
        session_id: str,
        question_id: Optional[str],
        question_text: str,
        difficulty: int,
        transcript: Optional[str] = None,
        latency_ms: Optional[int] = None,
        created_at: datetime = None
    ):
        self.id = id
        self.session_id = session_id
        self.question_id = question_id
        self.question_text = question_text
        self.difficulty = difficulty
        self.transcript = transcript
        self.latency_ms = latency_ms
        self.created_at = created_at or datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "question_id": self.question_id,
            "question_text": self.question_text,
            "difficulty": self.difficulty,
            "transcript": self.transcript,
            "latency_ms": self.latency_ms,
            "created_at": self.created_at
        }
    
    @staticmethod
    def from_dict(id: str, data: Dict[str, Any]) -> 'SessionQuestion':
        return SessionQuestion(
            id=id,
            session_id=data.get("session_id"),
            question_id=data.get("question_id"),
            question_text=data.get("question_text"),
            difficulty=data.get("difficulty"),
            transcript=data.get("transcript"),
            latency_ms=data.get("latency_ms"),
            created_at=data.get("created_at")
        )


class AnswerEvaluation:
    """Answer evaluation model"""
    def __init__(
        self,
        id: str,
        session_question_id: str,
        score_dimension_1: float,
        score_dimension_2: float,
        score_dimension_3: float,
        score_dimension_4: float,
        score_dimension_5: float,
        composite_score: float,
        strengths_json: list,
        improvements_json: list,
        next_question_strategy: Optional[str] = None,
        confidence: Optional[float] = None,
        created_at: datetime = None
    ):
        self.id = id
        self.session_question_id = session_question_id
        self.score_dimension_1 = score_dimension_1
        self.score_dimension_2 = score_dimension_2
        self.score_dimension_3 = score_dimension_3
        self.score_dimension_4 = score_dimension_4
        self.score_dimension_5 = score_dimension_5
        self.composite_score = composite_score
        self.strengths_json = strengths_json
        self.improvements_json = improvements_json
        self.next_question_strategy = next_question_strategy
        self.confidence = confidence
        self.created_at = created_at or datetime.utcnow()
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_question_id": self.session_question_id,
            "score_dimension_1": self.score_dimension_1,
            "score_dimension_2": self.score_dimension_2,
            "score_dimension_3": self.score_dimension_3,
            "score_dimension_4": self.score_dimension_4,
            "score_dimension_5": self.score_dimension_5,
            "composite_score": self.composite_score,
            "strengths_json": self.strengths_json,
            "improvements_json": self.improvements_json,
            "next_question_strategy": self.next_question_strategy,
            "confidence": self.confidence,
            "created_at": self.created_at
        }
    
    @staticmethod
    def from_dict(id: str, data: Dict[str, Any]) -> 'AnswerEvaluation':
        return AnswerEvaluation(
            id=id,
            session_question_id=data.get("session_question_id"),
            score_dimension_1=data.get("score_dimension_1"),
            score_dimension_2=data.get("score_dimension_2"),
            score_dimension_3=data.get("score_dimension_3"),
            score_dimension_4=data.get("score_dimension_4"),
            score_dimension_5=data.get("score_dimension_5"),
            composite_score=data.get("composite_score"),
            strengths_json=data.get("strengths_json", []),
            improvements_json=data.get("improvements_json", []),
            next_question_strategy=data.get("next_question_strategy"),
            confidence=data.get("confidence"),
            created_at=data.get("created_at")
        )
