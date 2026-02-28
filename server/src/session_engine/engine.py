"""
Interview session engine
Core logic for managing interview sessions
"""
from typing import Optional, List, Tuple
import random
import logging

from src.db.models import (
    InterviewSession, SessionQuestion, Question,
    AnswerEvaluation, InterviewMode
)
from src.db.firebase_client import get_db, Collections
from src.ai_evaluator.content_generator import AIContentGenerator
from src.utils.config import settings

logger = logging.getLogger(__name__)


class InterviewEngine:
    """Manages interview session flow and adaptive logic"""
    
    def __init__(self):
        self.db = get_db()
        self.content_generator = AIContentGenerator()
    
    def generate_next_question(self, session: InterviewSession) -> SessionQuestion:
        """
        Generate or select next question based on session context
        
        Implements adaptive difficulty based on recent performance
        """
        # Get recent questions and evaluations
        recent_questions = self._get_recent_questions(session.id, limit=2)
        
        # Calculate adaptive difficulty
        current_difficulty = self._calculate_adaptive_difficulty(session, recent_questions)
        
        preferences = self._get_user_preferences(session.user_id)
        previous_improvements = self._get_recent_improvements(session.id, limit=3)
        question_text = self.content_generator.generate_question(
            session.mode,
            current_difficulty,
            preferences=preferences,
            previous_improvements=previous_improvements,
        )
        
        # Create session question
        sq_ref = self.db.collection(Collections.SESSION_QUESTIONS).document()
        session_question = SessionQuestion(
            id=sq_ref.id,
            session_id=session.id,
            question_id=None,
            question_text=question_text,
            difficulty=current_difficulty
        )
        
        sq_ref.set(session_question.to_dict())
        
        # Update session
        self.db.collection(Collections.SESSIONS).document(session.id).update({
            'difficulty_current': current_difficulty,
            'questions_count': session.questions_count + 1
        })
        
        logger.info(f"Generated question for session {session.id}, difficulty {current_difficulty}")
        return session_question

    def _get_user_preferences(self, user_id: str) -> Optional[dict]:
        user_doc = self.db.collection(Collections.USERS).document(user_id).get()
        if not user_doc.exists:
            return None
        user_data = user_doc.to_dict() or {}
        profile = user_data.get("profile") or {}
        if not isinstance(profile, dict):
            return None
        preferences = profile.get("preferences")
        return preferences if isinstance(preferences, dict) else None

    def _get_recent_improvements(self, session_id: str, limit: int = 3) -> List[str]:
        improvements: List[str] = []
        questions = (
            self.db.collection(Collections.SESSION_QUESTIONS)
            .where("session_id", "==", session_id)
            .limit(limit)
            .get()
        )
        for q_doc in questions:
            evals = (
                self.db.collection(Collections.EVALUATIONS)
                .where("session_question_id", "==", q_doc.id)
                .limit(1)
                .get()
            )
            for e_doc in evals:
                eval_data = e_doc.to_dict() or {}
                eval_improvements = eval_data.get("improvements") or []
                if isinstance(eval_improvements, list):
                    improvements.extend(
                        [item for item in eval_improvements if isinstance(item, str)]
                    )
        return improvements[:limit]
    
    def _get_recent_questions(
        self, 
        session_id: str, 
        limit: int = 2
    ) -> List[Tuple[SessionQuestion, Optional[AnswerEvaluation]]]:
        """Get recent questions with their evaluations"""
        from google.cloud import firestore
        questions = self.db.collection(Collections.SESSION_QUESTIONS)\
            .where('session_id', '==', session_id)\
            .order_by('created_at', direction=firestore.Query.DESCENDING)\
            .limit(limit)\
            .get()
        
        result = []
        for q_doc in questions:
            q = SessionQuestion.from_dict(q_doc.id, q_doc.to_dict())
            
            # Get evaluation if exists
            evals = self.db.collection(Collections.EVALUATIONS)\
                .where('session_question_id', '==', q.id)\
                .limit(1)\
                .get()
            
            eval_data = None
            for e_doc in evals:
                eval_data = AnswerEvaluation.from_dict(e_doc.id, e_doc.to_dict())
                break
            
            result.append((q, eval_data))
        
        return result
    
    def _calculate_adaptive_difficulty(
        self,
        session: InterviewSession,
        recent_questions: List[Tuple[SessionQuestion, Optional[AnswerEvaluation]]]
    ) -> int:
        """
        Calculate next difficulty based on recent performance
        
        Strategy:
        - Average score >= 4.0: increase difficulty
        - Average score <= 2.0: decrease difficulty
        - Otherwise: maintain difficulty
        """
        if not recent_questions:
            return session.difficulty_start
        
        # Calculate rolling average of last 2 questions
        scores = []
        for q, eval_data in recent_questions:
            if eval_data and eval_data.eval_confidence >= settings.MIN_EVAL_CONFIDENCE:
                scores.append(eval_data.composite_score)
        
        if not scores:
            return session.difficulty_current
        
        avg_score = sum(scores) / len(scores)
        current_difficulty = session.difficulty_current
        
        # Adaptive logic
        if avg_score >= 4.0:
            new_difficulty = min(5, current_difficulty + 1)
            logger.info(f"Increasing difficulty: {current_difficulty} -> {new_difficulty} (avg score: {avg_score:.2f})")
            return new_difficulty
        elif avg_score <= 2.0:
            new_difficulty = max(1, current_difficulty - 1)
            logger.info(f"Decreasing difficulty: {current_difficulty} -> {new_difficulty} (avg score: {avg_score:.2f})")
            return new_difficulty
        else:
            logger.info(f"Maintaining difficulty: {current_difficulty} (avg score: {avg_score:.2f})")
            return current_difficulty
    
    def _get_question_from_bank(
        self,
        mode: InterviewMode,
        difficulty: int
    ) -> Optional[Question]:
        """Get random question from database question bank"""
        questions = self.db.collection(Collections.QUESTIONS)\
            .where('mode', '==', mode.value)\
            .where('difficulty', '==', difficulty)\
            .limit(10)\
            .get()
        
        questions_list = list(questions)
        if questions_list:
            selected = random.choice(questions_list)
            return Question.from_dict(selected.id, selected.to_dict())
        
        logger.warning(f"No questions found for mode={mode.value}, difficulty={difficulty}")
        return None
    
    def _generate_fallback_question(self, mode: InterviewMode, difficulty: int) -> str:
        """Generate fallback question if bank is empty"""
        if mode == InterviewMode.DSA:
            questions = {
                1: "Explain how you would reverse a string in your preferred programming language.",
                2: "How would you check if a string is a palindrome? Discuss time and space complexity.",
                3: "Design an algorithm to find the longest palindromic substring in a given string.",
                4: "Implement a function to find the median of two sorted arrays.",
                5: "Design a data structure that supports insert, delete, and getRandom in O(1) time."
            }
        elif mode == InterviewMode.HR:
            questions = {
                1: "Tell me about yourself and your background.",
                2: "Why are you interested in this role?",
                3: "Describe a challenging project you worked on and how you overcame obstacles.",
                4: "Tell me about a time when you had to work with a difficult team member.",
                5: "Describe a situation where you had to make a difficult decision with incomplete information."
            }
        else:  # BEHAVIORAL or SYSTEM_DESIGN
            questions = {
                1: "Describe your approach to learning new technologies.",
                2: "How do you handle feedback and criticism?",
                3: "Tell me about a time you failed and what you learned from it.",
                4: "How do you prioritize tasks when everything seems urgent?",
                5: "Describe a situation where you had to influence others without authority."
            }
        
        return questions.get(difficulty, questions.get(3, "Tell me about a recent project you're proud of."))
    
    def generate_summary(self, session: InterviewSession) -> dict:
        """Generate end-of-session summary with analytics"""
        # Get all questions for this session
        questions = self.db.collection(Collections.SESSION_QUESTIONS)\
            .where('session_id', '==', session.id)\
            .get()
        
        all_strengths = []
        all_improvements = []
        total_score = 0
        count = 0
        dimension_scores = {f"dimension_{i}": [] for i in range(1, 6)}
        
        for q_doc in questions:
            q = SessionQuestion.from_dict(q_doc.id, q_doc.to_dict())
            
            # Get evaluation
            evals = self.db.collection(Collections.EVALUATIONS)\
                .where('session_question_id', '==', q.id)\
                .limit(1)\
                .get()
            
            for e_doc in evals:
                eval_data = AnswerEvaluation.from_dict(e_doc.id, e_doc.to_dict())
                all_strengths.extend(eval_data.strengths)
                all_improvements.extend(eval_data.improvements)
                total_score += eval_data.composite_score
                count += 1
                
                # Track dimension scores
                for i in range(1, 6):
                    dimension_scores[f"dimension_{i}"].append(
                        getattr(eval_data, f"score_dimension_{i}")
                    )
        
        avg_score = total_score / count if count > 0 else 0
        
        # Calculate dimension averages
        dimension_averages = {}
        for dim, scores in dimension_scores.items():
            if scores:
                dimension_averages[dim] = sum(scores) / len(scores)
        
        # Update session
        self.db.collection(Collections.SESSIONS).document(session.id).update({
            'total_score': avg_score,
            'difficulty_end': session.difficulty_current
        })
        
        # Generate action plan
        action_plan = self._generate_action_plan(all_improvements, session.mode)
        
        return {
            "session_id": session.id,
            "mode": session.mode.value,
            "total_score": round(avg_score, 2),
            "duration_sec": session.duration_sec,
            "questions_count": count,
            "difficulty_progression": {
                "start": session.difficulty_start,
                "end": session.difficulty_current
            },
            "dimension_averages": dimension_averages,
            "strengths": list(set(all_strengths))[:5],
            "improvements": list(set(all_improvements))[:5],
            "action_plan": action_plan
        }
    
    def _generate_action_plan(self, improvements: List[str], mode: InterviewMode) -> List[str]:
        """Generate actionable next steps based on improvements"""
        if not improvements:
            return ["Continue practicing regularly to maintain your skills."]
        
        plans = [
            f"Focus on: {improvements[0] if improvements else 'communication clarity'}",
            "Practice with a timer to improve response speed",
            "Record yourself and review for clarity and structure"
        ]
        
        if mode == InterviewMode.DSA:
            plans.append("Solve 2-3 similar problems on LeetCode or HackerRank")
            plans.append("Review time and space complexity analysis")
        elif mode == InterviewMode.HR:
            plans.append("Prepare STAR format examples for common scenarios")
            plans.append("Practice storytelling with specific metrics and outcomes")
        
        return plans
