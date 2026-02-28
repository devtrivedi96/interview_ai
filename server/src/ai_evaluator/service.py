"""
AI Evaluator Service
LLM-based answer evaluation with rubric scoring
"""
import json
import logging
from typing import Dict
import asyncio
from openai import AsyncOpenAI
import jsonschema

from src.db.models import InterviewSession, SessionQuestion, AnswerEvaluation, InterviewMode
from src.ai_evaluator.prompts import get_evaluation_prompt, get_rubric_dimensions
from src.utils.config import settings

logger = logging.getLogger(__name__)

try:
    import boto3
except Exception:
    boto3 = None


class AIEvaluatorService:
    """Evaluates interview answers using LLM"""
    
    def __init__(self):
        self.provider = settings.AI_PROVIDER.lower()
        self.model = settings.AI_MODEL
        self.client = None
        self.bedrock_client = None
        self.bedrock_model_id = settings.AWS_BEDROCK_MODEL_ID

        if self.provider == "openai":
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        elif self.provider == "aws_bedrock":
            if boto3 is None:
                raise ValueError("boto3 is required for AI_PROVIDER=aws_bedrock")
            region = settings.AWS_BEDROCK_REGION or settings.AWS_REGION
            if not region:
                raise ValueError("Set AWS_BEDROCK_REGION or AWS_REGION for Bedrock")
            if not self.bedrock_model_id:
                raise ValueError("Set AWS_BEDROCK_MODEL_ID for Bedrock")
            self.bedrock_client = boto3.client("bedrock-runtime", region_name=region)
        else:
            raise ValueError("Unsupported AI_PROVIDER. Use 'openai' or 'aws_bedrock'.")

        self.schema = self._load_schema()
    
    def _load_schema(self) -> dict:
        """Load JSON schema for validation"""
        try:
            with open('src/schemas/evaluator_schema.json', 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"Failed to load evaluator schema: {e}")
            return {}
    
    async def evaluate_answer(
        self,
        session: InterviewSession,
        question: SessionQuestion,
        transcript: str
    ) -> AnswerEvaluation:
        """
        Evaluate answer and return structured feedback
        
        Args:
            session: Interview session context
            question: Question being answered
            transcript: User's answer transcript
        
        Returns:
            AnswerEvaluation with scores and feedback
        """
        # Build evaluation prompt
        prompt = get_evaluation_prompt(
            mode=session.mode,
            question_text=question.question_text,
            transcript=transcript,
            difficulty=question.difficulty
        )
        
        # Call LLM with retry logic
        for attempt in range(settings.AI_MAX_RETRIES):
            try:
                response = await self._call_llm(prompt)
                evaluation_data = self._parse_and_validate(response)
                break
            except Exception as e:
                logger.warning(f"Evaluation attempt {attempt + 1} failed: {e}")
                if attempt == settings.AI_MAX_RETRIES - 1:
                    # Fallback evaluation
                    logger.error("All evaluation attempts failed, using fallback")
                    evaluation_data = self._fallback_evaluation()
        
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
            strengths=evaluation_data["strengths"],
            improvements=evaluation_data["improvements"],
            next_question_strategy=evaluation_data.get("next_question_strategy"),
            eval_confidence=evaluation_data.get("eval_confidence", 0.8)
        )
        
        return evaluation
    
    async def _call_llm(self, prompt: str) -> str:
        """Call LLM API with timeout"""
        if self.provider == "aws_bedrock":
            return await self._call_bedrock(prompt)

        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert interview evaluator. Always respond with valid JSON matching the required schema."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=settings.AI_TEMPERATURE,
                response_format={"type": "json_object"},
                timeout=settings.AI_TIMEOUT_SEC
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"LLM API call failed: {e}")
            raise

    async def _call_bedrock(self, prompt: str) -> str:
        """Call AWS Bedrock model."""
        return await asyncio.to_thread(self._invoke_bedrock, prompt)

    def _invoke_bedrock(self, prompt: str) -> str:
        model_id = self.bedrock_model_id

        if model_id.startswith("anthropic."):
            payload = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": settings.AWS_BEDROCK_MAX_TOKENS,
                "temperature": settings.AI_TEMPERATURE,
                "messages": [
                    {
                        "role": "user",
                        "content": (
                            "You are an expert interview evaluator. "
                            "Always return valid JSON only, no markdown.\n\n"
                            f"{prompt}"
                        ),
                    }
                ],
            }
            response = self.bedrock_client.invoke_model(
                modelId=model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(payload),
            )
            data = json.loads(response["body"].read())
            content = data.get("content", [])
            return "".join(
                part.get("text", "") for part in content if isinstance(part, dict)
            )

        if model_id.startswith("amazon.titan"):
            payload = {
                "inputText": (
                    "You are an expert interview evaluator. "
                    "Always return valid JSON only, no markdown.\n\n"
                    f"{prompt}"
                ),
                "textGenerationConfig": {
                    "maxTokenCount": settings.AWS_BEDROCK_MAX_TOKENS,
                    "temperature": settings.AI_TEMPERATURE,
                    "topP": 0.9,
                },
            }
            response = self.bedrock_client.invoke_model(
                modelId=model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(payload),
            )
            data = json.loads(response["body"].read())
            results = data.get("results", [])
            if results:
                return results[0].get("outputText", "")
            return ""

        raise ValueError(
            "Unsupported Bedrock model family. Use Anthropic Claude or Amazon Titan model ids."
        )
    
    def _parse_and_validate(self, response: str) -> Dict:
        """Parse and validate LLM response against schema"""
        response = response.strip()
        if response.startswith("```"):
            response = response.strip("`")
            if response.lower().startswith("json"):
                response = response[4:].strip()

        try:
            data = json.loads(response)
        except json.JSONDecodeError as e:
            logger.error(f"Invalid JSON response: {e}")
            raise ValueError("LLM returned invalid JSON")
        
        # Validate against schema
        if self.schema:
            try:
                jsonschema.validate(instance=data, schema=self.schema)
            except jsonschema.ValidationError as e:
                logger.error(f"Schema validation failed: {e}")
                raise ValueError(f"Response doesn't match schema: {e.message}")
        
        # Calculate composite score if not provided correctly
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
            "improvements": ["Evaluation service temporarily unavailable - please try again"],
            "next_question_strategy": "same",
            "eval_confidence": 0.3
        }
