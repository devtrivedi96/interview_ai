"""
Session and interview schemas
"""
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime


class SessionCreate(BaseModel):
    mode: str  # 'DSA' or 'HR'
    difficulty_start: int = 3


class QuestionResponse(BaseModel):
    id: str
    question_text: str
    difficulty: int


class AnswerSubmit(BaseModel):
    transcript: str
    audio_duration_sec: Optional[float] = None


class EvaluationResponse(BaseModel):
    composite_score: float
    strengths: List[str]
    improvements: List[str]
    dimension_scores: dict


class SessionSummary(BaseModel):
    session_id: str
    mode: str
    total_score: Optional[float]
    duration_sec: Optional[int]
    questions_count: int
    strengths: List[str]
    improvements: List[str]
    action_plan: List[str]


class SessionResponse(BaseModel):
    id: str
    mode: str
    difficulty_start: int
    state: str
    created_at: datetime
    
    class Config:
        from_attributes = True
