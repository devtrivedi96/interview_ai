import boto3
import json
import logging
from typing import Optional

import requests

from src.utils.config import settings

logger = logging.getLogger(__name__)


class BedrockService:
    def __init__(self):
        """Thin wrapper around Bedrock Runtime for question generation.

        Configuration is aligned with test_bedrock_bearer.py:
        - Region comes from AWS_BEDROCK_REGION (falls back to AWS_REGION).
        - Model ID comes from AWS_BEDROCK_MODEL_ID, defaulting to Claude 3 Haiku.
        """

        region = settings.AWS_BEDROCK_REGION or settings.AWS_REGION
        self.client = boto3.client(
            service_name="bedrock-runtime",
            region_name=region,
        )

        # Match the working test script and allow override via env
        self.model_id = (
            settings.AWS_BEDROCK_MODEL_ID
            or "anthropic.claude-3-haiku-20240307-v1:0"
        )

    def generate_question(
        self,
        mode: str,
        difficulty: int,
        language: Optional[str] = None,
        preferred_roles: Optional[list] = None,
    ) -> str:
        """Generate a single interview question.

        If ``language`` is provided (for example "C++" or "Python"), the
        underlying LLM is nudged to frame the question in that language
        (for code examples, APIs, etc.).
        
        If ``preferred_roles`` is provided (for example ["Frontend Engineer", "Full Stack"]),
        the question will be tailored to those roles.
        """

        language_hint = ""
        if language:
            language_hint = (
                f"Primary coding language: {language}.\n"
                "If the question involves code or implementation, use this language "
                "for examples and terminology.\n\n"
            )
        
        role_hint = ""
        if preferred_roles and isinstance(preferred_roles, list) and len(preferred_roles) > 0:
            roles_str = ", ".join(str(r) for r in preferred_roles[:3])
            role_hint = (
                f"Target roles: {roles_str}.\n"
                "Tailor the question to be relevant and practical for these roles.\n\n"
            )

        prompt = f"""
You are a FAANG-level interviewer.

Generate exactly ONE interview question.

Interview Mode: {mode}
Difficulty Level: {difficulty} (1=easy, 5=very hard)
{language_hint}{role_hint}Rules:
- Only output the question.
- No explanation.
- No answer.
- Keep it realistic and professional.
"""

        payload = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 300,
            "temperature": 0.7,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        }

        try:
            response = self.client.invoke_model(
                modelId=self.model_id,
                body=json.dumps(payload),
                contentType="application/json",
                accept="application/json"
            )

            result = json.loads(response["body"].read())
            return result["content"][0]["text"].strip()

        except Exception as e:
            logger.error(f"Bedrock generation failed: {str(e)}")
            return self._fallback_question(mode, difficulty, prompt)
    def _fallback_question(self, mode: str, difficulty: int, prompt: Optional[str] = None) -> str:
        """Return a fallback question when Bedrock is unavailable.

        Strategy:
        1. Try GROQ, then Gemini, then OpenAI using configured API keys.
        2. If all providers fail or are not configured, use a local deterministic question.
        """
        level = max(1, min(5, int(difficulty or 3)))
        mode_key = (mode or "").upper()

        # First, try external LLM providers if we have a prompt
        if prompt:
            for provider_name, caller in [
                ("groq", self._fallback_groq),
                ("gemini", self._fallback_gemini),
                ("openai", self._fallback_openai),
            ]:
                try:
                    result = caller(prompt)
                    if result:
                        logger.warning(
                            "Using %s fallback provider for question generation (mode=%s, difficulty=%s)",
                            provider_name,
                            mode_key,
                            level,
                        )
                        return result.strip()
                except Exception as provider_err:
                    logger.error(
                        "%s fallback provider failed: %s",
                        provider_name,
                        str(provider_err),
                    )

        # If no external provider worked, fall back to static questions
        if mode_key == "DSA":
            questions = {
                1: "How would you reverse a string and what is the time complexity?",
                2: "How would you determine whether a linked list contains a cycle?",
                3: "Design an algorithm to find the first non-repeating character in a string.",
                4: "How would you find the k-th largest element in an unsorted array efficiently?",
                5: "Design a data structure that supports O(1) insert, delete, and getRandom.",
            }
        elif mode_key == "HR":
            questions = {
                1: "Tell me about yourself and your current goals.",
                2: "Why do you want to work in this role and at this company?",
                3: "Describe a challenge you faced recently and how you handled it.",
                4: "Tell me about a time you disagreed with a teammate and what happened.",
                5: "Describe a high-stakes decision you made with incomplete information.",
            }
        elif mode_key == "SYSTEM_DESIGN":
            questions = {
                1: "How would you design a URL shortener at a high level?",
                2: "Design a rate limiter for a public API.",
                3: "Design a real-time chat service for small groups.",
                4: "Design a scalable notification service with retry guarantees.",
                5: "Design a globally distributed feed system for millions of users.",
            }
        else:
            questions = {
                1: "Tell me about a time you learned a new skill quickly.",
                2: "Describe a situation where you had to adapt your communication style.",
                3: "Tell me about a time you failed and what you changed afterward.",
                4: "Describe how you prioritized competing deadlines in a tough week.",
                5: "Give an example of influencing a decision without formal authority.",
            }

        fallback = questions.get(level, questions[3])
        logger.warning(
            "Using static fallback question because all providers failed "
            "(mode=%s, difficulty=%s)",
            mode_key,
            level,
        )
        return fallback

    def _fallback_groq(self, prompt: str) -> Optional[str]:
        """Try generating a question using GROQ's OpenAI-compatible API.

        Returns None if GROQ is not configured or if the call fails.
        """
        api_key = getattr(settings, "GROQ_API_KEY", "")
        if not api_key:
            return None

        url = "https://api.groq.com/openai/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        model = getattr(settings, "GROQ_MODEL", "llama3-8b-8192")

        payload = {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            "temperature": settings.AI_TEMPERATURE,
            "max_tokens": 300,
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
            return None
        return choices[0]["message"]["content"]

    def _fallback_gemini(self, prompt: str) -> Optional[str]:
        """Try generating a question using Google Gemini.

        Returns None if Gemini is not configured or if the call fails.
        """
        api_key = getattr(settings, "GEMINI_API_KEY", "")
        if not api_key:
            return None

        model = getattr(settings, "GEMINI_MODEL", "gemini-1.5-flash")
        url = (
            f"https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:generateContent?key={api_key}"
        )

        payload = {
            "contents": [
                {
                    "parts": [
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
        data = response.json()
        candidates = data.get("candidates") or []
        if not candidates:
            return None
        content = candidates[0].get("content", {})
        parts = content.get("parts") or []
        texts = [p.get("text", "") for p in parts if isinstance(p, dict)]
        text = "".join(texts).strip()
        return text or None

    def _fallback_openai(self, prompt: str) -> Optional[str]:
        """Try generating a question using OpenAI's Chat Completions API.

        Returns None if OpenAI is not configured or if the call fails.
        """
        api_key = settings.OPENAI_API_KEY
        if not api_key:
            return None

        url = "https://api.openai.com/v1/chat/completions"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        }
        model = settings.AI_MODEL or "gpt-4o-mini"

        payload = {
            "model": model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            "temperature": settings.AI_TEMPERATURE,
            "max_tokens": 300,
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
            return None
        return choices[0]["message"]["content"]
