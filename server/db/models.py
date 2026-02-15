"""
Database models
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, JSON, Enum
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from db.database import Base


class InterviewMode(str, enum.Enum):
    DSA = "DSA"
    HR = "HR"


class SessionState(str, enum.Enum):
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


class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    sessions = relationship("InterviewSession", back_populates="user")


class InterviewSession(Base):
    __tablename__ = "interview_sessions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mode = Column(Enum(InterviewMode), nullable=False)
    difficulty_start = Column(Integer, default=3)
    difficulty_end = Column(Integer, nullable=True)
    total_score = Column(Float, nullable=True)
    duration_sec = Column(Integer, nullable=True)
    state = Column(Enum(SessionState), default=SessionState.INIT)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    user = relationship("User", back_populates="sessions")
    questions = relationship("SessionQuestion", back_populates="session")


class Question(Base):
    __tablename__ = "questions"
    
    id = Column(Integer, primary_key=True, index=True)
    mode = Column(Enum(InterviewMode), nullable=False)
    difficulty = Column(Integer, nullable=False)
    question_text = Column(Text, nullable=False)
    reference_answer = Column(Text, nullable=True)
    metadata = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class SessionQuestion(Base):
    __tablename__ = "session_questions"
    
    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(Integer, ForeignKey("interview_sessions.id"), nullable=False)
    question_id = Column(Integer, ForeignKey("questions.id"), nullable=True)
    question_text = Column(Text, nullable=False)
    difficulty = Column(Integer, nullable=False)
    transcript = Column(Text, nullable=True)
    latency_ms = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session = relationship("InterviewSession", back_populates="questions")
    evaluation = relationship("AnswerEvaluation", back_populates="session_question", uselist=False)


class AnswerEvaluation(Base):
    __tablename__ = "answer_evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    session_question_id = Column(Integer, ForeignKey("session_questions.id"), nullable=False)
    
    # Rubric scores (0-5)
    score_dimension_1 = Column(Float, nullable=False)
    score_dimension_2 = Column(Float, nullable=False)
    score_dimension_3 = Column(Float, nullable=False)
    score_dimension_4 = Column(Float, nullable=False)
    score_dimension_5 = Column(Float, nullable=False)
    
    composite_score = Column(Float, nullable=False)
    strengths_json = Column(JSON, nullable=False)
    improvements_json = Column(JSON, nullable=False)
    next_question_strategy = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    session_question = relationship("SessionQuestion", back_populates="evaluation")
