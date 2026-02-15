"""
Interview Engine - State machine and orchestration
"""
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from typing import Optional
import random

from db.models import (
    InterviewSession, SessionQuestion, Question, 
    AnswerEvaluation, SessionState, InterviewMode
)
from schemas.session import SessionSummary


class InterviewEngine:
    """Manages interview session flow and adaptive logic"""
    
    def __init__(self, db: AsyncSession):
        self.db = db
    
    async def generate_next_question(self, session: InterviewSession) -> SessionQuestion:
        """Generate or select next question based on session context"""
        # Get previous questions to calculate current difficulty
        result = await self.db.execute(
            select(SessionQuestion, AnswerEvaluation)
            .outerjoin(AnswerEvaluation)
            .where(SessionQuestion.session_id == session.id)
            .order_by(SessionQuestion.created_at.desc())
            .limit(2)
        )
        recent_questions = result.all()
        
        # Determine difficulty for next question
        current_difficulty = await self._calculate_adaptive_difficulty(
            session, recent_questions
        )
        
        # Get question from bank or generate
        question = await self._get_question_from_bank(session.mode, current_difficulty)
        
        # Create session question
        session_question = SessionQuestion(
            session_id=session.id,
            question_id=question.id if question else None,
            question_text=question.question_text if question else self._generate_fallback_question(session.mode, current_difficulty),
            difficulty=current_difficulty
        )
        
        self.db.add(session_question)
        session.state = SessionState.ASK_QUESTION
        await self.db.commit()
        await self.db.refresh(session_question)
        
        return session_question
    
    async def _calculate_adaptive_difficulty(
        self, 
        session: InterviewSession, 
        recent_questions
    ) -> int:
        """Calculate next difficulty based on recent performance"""
        if not recent_questions:
            return session.difficulty_start
        
        # Calculate rolling average of last 2 questions
        scores = []
        for sq, eval in recent_questions:
            if eval:
                scores.append(eval.composite_score)
        
        if not scores:
            return session.difficulty_start
        
        avg_score = sum(scores) / len(scores)
        current_difficulty = recent_questions[0][0].difficulty
        
        # Adaptive logic
        if avg_score >= 4.0:
            return min(5, current_difficulty + 1)
        elif avg_score <= 2.0:
            return max(1, current_difficulty - 1)
        else:
            return current_difficulty
    
    async def _get_question_from_bank(
        self, 
        mode: InterviewMode, 
        difficulty: int
    ) -> Optional[Question]:
        """Get question from database question bank"""
        result = await self.db.execute(
            select(Question)
            .where(Question.mode == mode, Question.difficulty == difficulty)
            .order_by(func.random())
            .limit(1)
        )
        return result.scalar_one_or_none()
    
    def _generate_fallback_question(self, mode: InterviewMode, difficulty: int) -> str:
        """Generate fallback question if bank is empty"""
        if mode == InterviewMode.DSA:
            questions = {
                1: "Explain how you would reverse a string in your preferred language.",
                3: "Design an algorithm to find the longest palindromic substring in a given string.",
                5: "Implement a function to serialize and deserialize a binary tree."
            }
        else:  # HR
            questions = {
                1: "Tell me about yourself and your background.",
                3: "Describe a challenging project you worked on and how you overcame obstacles.",
                5: "Tell me about a time when you had to make a difficult decision with incomplete information."
            }
        
        return questions.get(difficulty, questions[3])
    
    async def generate_summary(self, session: InterviewSession) -> SessionSummary:
        """Generate end-of-session summary"""
        # Get all questions and evaluations
        result = await self.db.execute(
            select(SessionQuestion, AnswerEvaluation)
            .outerjoin(AnswerEvaluation)
            .where(SessionQuestion.session_id == session.id)
        )
        questions_evals = result.all()
        
        all_strengths = []
        all_improvements = []
        total_score = 0
        count = 0
        
        for sq, eval in questions_evals:
            if eval:
                all_strengths.extend(eval.strengths_json)
                all_improvements.extend(eval.improvements_json)
                total_score += eval.composite_score
                count += 1
        
        avg_score = total_score / count if count > 0 else 0
        
        # Update session
        session.total_score = avg_score
        session.state = SessionState.COMPLETE
        await self.db.commit()
        
        # Generate action plan
        action_plan = self._generate_action_plan(all_improvements, session.mode)
        
        return SessionSummary(
            session_id=session.id,
            mode=session.mode,
            total_score=round(avg_score, 2),
            duration_sec=session.duration_sec,
            questions_count=count,
            strengths=list(set(all_strengths))[:5],
            improvements=list(set(all_improvements))[:5],
            action_plan=action_plan
        )
    
    def _generate_action_plan(self, improvements: list, mode: InterviewMode) -> list:
        """Generate actionable next steps"""
        if not improvements:
            return ["Continue practicing regularly to maintain your skills."]
        
        plans = [
            f"Focus on improving: {improvements[0] if improvements else 'communication clarity'}",
            "Practice with a timer to improve response speed",
            "Record yourself and review for clarity"
        ]
        
        if mode == InterviewMode.DSA:
            plans.append("Solve 2-3 similar problems on LeetCode")
        else:
            plans.append("Prepare STAR format examples for common scenarios")
        
        return plans
