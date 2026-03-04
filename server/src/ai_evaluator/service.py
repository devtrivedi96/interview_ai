"""AI Evaluator Service
LLM-based answer evaluation with rubric scoring.
"""
import json
import logging
from typing import Dict, Optional
import asyncio

import requests
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
        elif self.provider == "groq":
            # Groq will be called via fallback chain if needed, no client init required
            pass
        else:
            raise ValueError("Unsupported AI_PROVIDER. Use 'openai', 'groq', or 'aws_bedrock'.")

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
        """Call primary LLM provider with timeout, then fall back to others.

        Primary provider is controlled by AI_PROVIDER (openai, groq, or aws_bedrock).
        On failure, we fall back through the chain.
        """
        if self.provider == "aws_bedrock":
            try:
                return await self._call_bedrock(prompt)
            except Exception as e:
                logger.error(f"Bedrock evaluation call failed, trying fallbacks: {e}")
                return await self._call_fallback_llm(prompt)
        
        elif self.provider == "groq":
            try:
                return await self._call_groq_json(prompt)
            except Exception as e:
                logger.error(f"Groq evaluation call failed, trying fallbacks: {e}")
                return await self._call_fallback_llm(prompt)

        # Primary OpenAI client path (provider == "openai")
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": (
                            "You are an expert interview evaluator. "
                            "Always respond with valid JSON matching the required schema."
                        ),
                    },
                    {"role": "user", "content": prompt},
                ],
                temperature=settings.AI_TEMPERATURE,
                response_format={"type": "json_object"},
                timeout=settings.AI_TIMEOUT_SEC,
            )
            return response.choices[0].message.content
        except Exception as e:
            logger.error(f"OpenAI evaluation call failed, trying fallbacks: {e}")
            return await self._call_fallback_llm(prompt)

    async def _call_fallback_llm(self, prompt: str) -> str:
        """Fallback chain: Groq -> Gemini -> OpenAI HTTP.

        Returns raw JSON string from the first provider that succeeds.
        Raises the last error if all providers fail.
        """
        last_error: Optional[Exception] = None

        for provider_name, caller in [
            ("groq", self._call_groq_json),
            ("gemini", self._call_gemini_json),
            ("openai", self._call_openai_http_json),
        ]:
            try:
                content = await caller(prompt)
                if content:
                    logger.info(
                        "Using %s fallback provider for evaluation JSON", provider_name
                    )
                    return content
            except Exception as provider_err:
                last_error = provider_err
                logger.error(
                    "%s evaluation provider failed: %s",
                    provider_name,
                    str(provider_err),
                )

        if last_error:
            raise last_error
        raise RuntimeError("No evaluation provider available")

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

    async def _call_groq_json(self, prompt: str) -> str:
        """Call Groq's OpenAI-compatible API to get JSON evaluation."""
        api_key = getattr(settings, "GROQ_API_KEY", "")
        if not api_key:
            return ""

        return await asyncio.to_thread(self._invoke_groq_json, prompt)

    def _invoke_groq_json(self, prompt: str) -> str:
        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {getattr(settings, 'GROQ_API_KEY', '')}",
            "Content-Type": "application/json",
        }
        model = getattr(settings, "GROQ_MODEL", "llama-3.1-8b-instant")

        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are an expert interview evaluator. "
                        "Always return a single valid JSON object only, "
                        "no markdown, no prose, no code fences."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": settings.AI_TEMPERATURE,
            "max_tokens": settings.AWS_BEDROCK_MAX_TOKENS,
            "response_format": {"type": "json_object"},
        }

        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=settings.AI_TIMEOUT_SEC,
        )
        response.raise_for_status()
        data = response.json()
        choices = data.get("choices") or []
        if not choices:
            return ""
        content = (choices[0]["message"]["content"] or "").strip()
        return content

    async def _call_gemini_json(self, prompt: str) -> str:
        """Call Google Gemini to get JSON evaluation."""
        api_key = getattr(settings, "GEMINI_API_KEY", "")
        if not api_key:
            return ""

        return await asyncio.to_thread(self._invoke_gemini_json, prompt)

    def _invoke_gemini_json(self, prompt: str) -> str:
        model = getattr(settings, "GEMINI_MODEL", "gemini-1.5-flash")
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:generateContent?key={getattr(settings, 'GEMINI_API_KEY', '')}"
        )

        payload = {
            "contents": [
                {
                    "parts": [
                        {
                            "text": (
                                "You are an expert interview evaluator. "
                                "Return a single valid JSON object only."
                            )
                        },
                        {"text": prompt},
                    ]
                }
            ]
        }

        response = requests.post(
            url,
            json=payload,
            timeout=settings.AI_TIMEOUT_SEC,
        )
        response.raise_for_status()
        body = response.json()
        candidates = body.get("candidates") or []
        if not candidates:
            return ""
        content = candidates[0].get("content", {})
        parts = content.get("parts") or []
        texts = [p.get("text", "") for p in parts if isinstance(p, dict)]
        return "".join(texts).strip()

    async def _call_openai_http_json(self, prompt: str) -> str:
        """Call OpenAI HTTP API directly to get JSON evaluation.

        Used as a fallback even when the main provider is Bedrock.
        """
        api_key = settings.OPENAI_API_KEY
        if not api_key:
            return ""

        return await asyncio.to_thread(self._invoke_openai_http_json, prompt)

    def _invoke_openai_http_json(self, prompt: str) -> str:
        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {settings.OPENAI_API_KEY}",
            "Content-Type": "application/json",
        }
        model = settings.AI_MODEL or "gpt-4o-mini"

        payload = {
            "model": model,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are an expert interview evaluator. "
                        "Always return a single valid JSON object only."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": settings.AI_TEMPERATURE,
            "max_tokens": settings.AWS_BEDROCK_MAX_TOKENS,
            "response_format": {"type": "json_object"},
        }

        response = requests.post(
            url,
            headers=headers,
            json=payload,
            timeout=settings.AI_TIMEOUT_SEC,
        )
        response.raise_for_status()
        data = response.json()
        choices = data.get("choices") or []
        if not choices:
            return ""
        content = (choices[0]["message"]["content"] or "").strip()
        return content
    
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
                "dimension_1": 2.0,
                "dimension_2": 2.0,
                "dimension_3": 2.0,
                "dimension_4": 2.0,
                "dimension_5": 2.0
            },
            "composite_score": 2.0,
            "strengths": ["Attempted the question"],
            "improvements": [],
            "next_question_strategy": "same",
            "eval_confidence": 0.3
        }
