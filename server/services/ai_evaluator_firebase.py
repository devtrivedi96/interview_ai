"""
AI Evaluator - LLM-based answer evaluation and scoring (Firebase version)
"""
import json
from typing import Dict
import asyncio
from openai import AsyncOpenAI

from core.config import settings
from db.models_firebase import InterviewSession, SessionQuestion, AnswerEvaluation, InterviewMode


class AIEvaluator:
    """Evaluates interview answers using LLM"""
    
    def __init__(self):
        self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = settings.AI_MODEL
    
    def evaluate_answer(
        self,
        session: InterviewSession,
        question: SessionQuestion,
        transcript: str
    ) -> AnswerEvaluation:
        """Evaluate answer and return structured feedback"""
        
        # Build evaluation prompt
        prompt = self._build_evaluation_prompt(session.mode, question.question_text, transcript)
        
        # Call LLM with retry logic
        evaluation_data = None
        for attempt in range(settings.AI_MAX_RETRIES):
            try:
                response = asyncio.run(self._call_llm(prompt))
                evaluation_data = self._parse_llm_response(response)
                break
            except Exception as e:
                if attempt == settings.AI_MAX_RETRIES - 1:
                    # Fallback evaluation
                    evaluation_data = self._fallback_evaluation()
                continue
        
        # Create evaluation record
        evaluation = AnswerEvaluation(
            id="",  # Will be set when saved
            session_question_id=question.id,
            score_dimension_1=evaluation_data["scores"]["dimension_1"],
            score_dimension_2=evaluation_data["scores"]["dimension_2"],
            score_dimension_3=evaluation_data["scores"]["dimension_3"],
            score_dimension_4=evaluation_data["scores"]["dimension_4"],
            score_dimension_5=evaluation_data["scores"]["dimension_5"],
            composite_score=evaluation_data["composite_score"],
            strengths_json=evaluation_data["strengths"],
            improvements_json=evaluation_data["improvements"],
            next_question_strategy=evaluation_data.get("next_question_strategy"),
            confidence=evaluation_data.get("confidence", 0.8)
        )
        
        return evaluation
    
    def _build_evaluation_prompt(
        self, 
        mode: InterviewMode, 
        question: str, 
        transcript: str
    ) -> str:
        """Build structured evaluation prompt"""
        
        if mode == InterviewMode.DSA:
            rubric = """
Evaluate on these 5 dimensions (0-5 scale):
1. Problem Understanding - Did they grasp the problem correctly?
2. Approach Quality - Is the solution approach sound?
3. Correctness Reasoning - Did they explain why their solution works?
4. Complexity Analysis - Did they discuss time/space complexity?
5. Communication Clarity - Was the explanation clear and structured?
"""
        else:  # HR
            rubric = """
Evaluate on these 5 dimensions (0-5 scale):
1. Relevance - Does the answer address the question?
2. Structure - Is it organized (STAR format)?
3. Specific Evidence - Are there concrete examples?
4. Self-Awareness - Do they show reflection and learning?
5. Communication Clarity - Is it clear and professional?
"""
        
        prompt = f"""You are an expert interview evaluator. Evaluate this interview answer.

QUESTION: {question}

CANDIDATE ANSWER: {transcript}

{rubric}

Provide your evaluation in this exact JSON format:
{{
    "scores": {{
        "dimension_1": <0-5>,
        "dimension_2": <0-5>,
        "dimension_3": <0-5>,
        "dimension_4": <0-5>,
        "dimension_5": <0-5>
    }},
    "composite_score": <average of all dimensions>,
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["improvement 1", "improvement 2"],
    "next_question_strategy": "easier|same|harder",
    "confidence": <0-1>
}}

Be constructive and specific. Do not penalize accent or grammar unless comprehension fails.
"""
        return prompt
    
    async def _call_llm(self, prompt: str) -> str:
        """Call LLM API"""
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[
                {"role": "system", "content": "You are an expert interview evaluator. Always respond with valid JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )
        return response.choices[0].message.content
    
    def _parse_llm_response(self, response: str) -> Dict:
        """Parse and validate LLM response"""
        data = json.loads(response)
        
        # Validate schema
        required_keys = ["scores", "composite_score", "strengths", "improvements"]
        for key in required_keys:
            if key not in data:
                raise ValueError(f"Missing required key: {key}")
        
        # Calculate composite if not provided correctly
        scores = data["scores"]
        data["composite_score"] = sum(scores.values()) / len(scores)
        
        return data
    
    def _fallback_evaluation(self) -> Dict:
        """Fallback evaluation when LLM fails"""
        return {
            "scores": {
                "dimension_1": 3.0,
                "dimension_2": 3.0,
                "dimension_3": 3.0,
                "dimension_4": 3.0,
                "dimension_5": 3.0
            },
            "composite_score": 3.0,
            "strengths": ["Attempted the question"],
            "improvements": ["Evaluation service temporarily unavailable"],
            "next_question_strategy": "same",
            "confidence": 0.5
        }
