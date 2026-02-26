"""
Data models for the primary datastore
Defines the structure of documents stored in the DB (DynamoDB/Firestore-like)
"""
from datetime import datetime
from typing import Optional, Dict, Any, List
from enum import Enum
from pydantic import BaseModel, Field


class InterviewMode(str, Enum):
    """Interview types"""
    DSA = "DSA"
    HR = "HR"
    BEHAVIORAL = "BEHAVIORAL"
    SYSTEM_DESIGN = "SYSTEM_DESIGN"


class SessionState(str, Enum):
    """Session state machine states"""
    IDLE = "IDLE"
    INIT = "INIT"
    PROFILE_CHECK = "PROFILE_CHECK"
    ASK_QUESTION = "ASK_QUESTION"
    VOICE_CAPTURE = "VOICE_CAPTURE"
    QUALITY_CHECK = "QUALITY_CHECK"
    TRANSCRIBE = "TRANSCRIBE"
    EVALUATE = "EVALUATE"
    ADAPT = "ADAPT"
    COMPLETE = "COMPLETE"
    FAILED = "FAILED"


class User(BaseModel):
    """User profile model"""
    id: str
    email: str
    hashed_password: Optional[str] = None
    email_verified: bool = False
    audio_consent: bool = False
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_login: Optional[datetime] = None
    profile: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        data = {
            "email": self.email,
            "email_verified": self.email_verified,
            "audio_consent": self.audio_consent,
            "created_at": self.created_at,
            "last_login": self.last_login,
            "profile": self.profile or {}
        }
        if self.hashed_password:
            data["hashed_password"] = self.hashed_password
        return data
    
    @staticmethod
    def from_dict(id: str, data: Dict[str, Any]) -> 'User':
        return User(
            id=id,
            email=data.get("email"),
            hashed_password=data.get("hashed_password"),
            email_verified=data.get("email_verified", False),
            audio_consent=data.get("audio_consent", False),
            created_at=data.get("created_at"),
            last_login=data.get("last_login"),
            profile=data.get("profile")
        )


class InterviewSession(BaseModel):
    """Interview session model"""
    id: str
    user_id: str
    mode: InterviewMode
    difficulty_start: int = 3
    difficulty_current: int = 3
    difficulty_end: Optional[int] = None
    state: SessionState = SessionState.INIT
    total_score: Optional[float] = None
    duration_sec: Optional[int] = None
    questions_count: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    metadata: Optional[Dict[str, Any]] = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "user_id": self.user_id,
            "mode": self.mode.value,
            "difficulty_start": self.difficulty_start,
            "difficulty_current": self.difficulty_current,
            "difficulty_end": self.difficulty_end,
            "state": self.state.value,
            "total_score": self.total_score,
            "duration_sec": self.duration_sec,
            "questions_count": self.questions_count,
            "created_at": self.created_at,
            "completed_at": self.completed_at,
            "metadata": self.metadata or {}
        }
    
    @staticmethod
    def from_dict(id: str, data: Dict[str, Any]) -> 'InterviewSession':
        return InterviewSession(
            id=id,
            user_id=data.get("user_id"),
            mode=InterviewMode(data.get("mode")),
            difficulty_start=data.get("difficulty_start", 3),
            difficulty_current=data.get("difficulty_current", 3),
            difficulty_end=data.get("difficulty_end"),
            state=SessionState(data.get("state", "INIT")),
            total_score=data.get("total_score"),
            duration_sec=data.get("duration_sec"),
            questions_count=data.get("questions_count", 0),
            created_at=data.get("created_at"),
            completed_at=data.get("completed_at"),
            metadata=data.get("metadata")
        )


class Question(BaseModel):
    """Question bank model"""
    id: str
    mode: InterviewMode
    difficulty: int
    question_text: str
    reference_answer: Optional[str] = None
    tags: List[str] = []
    metadata: Optional[Dict[str, Any]] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "mode": self.mode.value,
            "difficulty": self.difficulty,
            "question_text": self.question_text,
            "reference_answer": self.reference_answer,
            "tags": self.tags,
            "metadata": self.metadata or {},
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
            tags=data.get("tags", []),
            metadata=data.get("metadata"),
            created_at=data.get("created_at")
        )


class SessionQuestion(BaseModel):
    """Question asked in a session"""
    id: str
    session_id: str
    question_id: Optional[str]
    question_text: str
    difficulty: int
    transcript: Optional[str] = None
    audio_url: Optional[str] = None
    audio_duration_sec: Optional[float] = None
    clarity_score: Optional[float] = None
    latency_ms: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_id": self.session_id,
            "question_id": self.question_id,
            "question_text": self.question_text,
            "difficulty": self.difficulty,
            "transcript": self.transcript,
            "audio_url": self.audio_url,
            "audio_duration_sec": self.audio_duration_sec,
            "clarity_score": self.clarity_score,
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
            audio_url=data.get("audio_url"),
            audio_duration_sec=data.get("audio_duration_sec"),
            clarity_score=data.get("clarity_score"),
            latency_ms=data.get("latency_ms"),
            created_at=data.get("created_at")
        )


class AnswerEvaluation(BaseModel):
    """AI evaluation of an answer"""
    id: str
    session_question_id: str
    
    # Rubric scores (0-5 scale)
    score_dimension_1: float
    score_dimension_2: float
    score_dimension_3: float
    score_dimension_4: float
    score_dimension_5: float
    
    composite_score: float
    strengths: List[str]
    improvements: List[str]
    next_question_strategy: Optional[str] = None  # easier, same, harder
    eval_confidence: float = 0.8
    created_at: datetime = Field(default_factory=datetime.utcnow)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "session_question_id": self.session_question_id,
            "score_dimension_1": self.score_dimension_1,
            "score_dimension_2": self.score_dimension_2,
            "score_dimension_3": self.score_dimension_3,
            "score_dimension_4": self.score_dimension_4,
            "score_dimension_5": self.score_dimension_5,
            "composite_score": self.composite_score,
            "strengths": self.strengths,
            "improvements": self.improvements,
            "next_question_strategy": self.next_question_strategy,
            "eval_confidence": self.eval_confidence,
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
            strengths=data.get("strengths", []),
            improvements=data.get("improvements", []),
            next_question_strategy=data.get("next_question_strategy"),
            eval_confidence=data.get("eval_confidence", 0.8),
            created_at=data.get("created_at")
        )
