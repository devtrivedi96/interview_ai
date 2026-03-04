"""
AI content generator for dynamic interview cards, questions and preparation plans.
"""
import json
import logging
from datetime import datetime, date
from typing import Any, Dict, List, Optional

import requests
from openai import OpenAI

from src.db.models import InterviewMode
from src.utils.config import settings

logger = logging.getLogger(__name__)

try:
    import boto3
except Exception:
    boto3 = None


DEFAULT_MODE_CARDS = [
    {
        "mode": "DSA",
        "title": "DSA",
        "subtitle": "Data Structures & Algorithms",
        "description": "Problem solving, complexity and coding fundamentals.",
        "difficulty_start": 3,
    },
    {
        "mode": "HR",
        "title": "HR",
        "subtitle": "Behavioral & Experience",
        "description": "Communication, leadership and impact storytelling.",
        "difficulty_start": 2,
    },
    {
        "mode": "BEHAVIORAL",
        "title": "Behavioral",
        "subtitle": "Situational Questions",
        "description": "STAR responses and practical decision making.",
        "difficulty_start": 2,
    },
    {
        "mode": "SYSTEM_DESIGN",
        "title": "System Design",
        "subtitle": "Architecture & Trade-offs",
        "description": "Scalability, reliability and system thinking.",
        "difficulty_start": 3,
    },
]


class AIContentGenerator:
    def __init__(self):
        self.provider = settings.AI_PROVIDER.lower()
        self.model = settings.AI_MODEL
        self.openai_client: Optional[OpenAI] = None
        self.bedrock_client = None
        self.bedrock_model_id = settings.AWS_BEDROCK_MODEL_ID

        if self.provider == "openai":
            try:
                self.openai_client = OpenAI(api_key=settings.OPENAI_API_KEY)
            except Exception as e:
                logger.warning(
                    f"OpenAI client initialization failed, using fallback generator: {e}"
                )
                self.provider = "fallback"
        elif self.provider == "aws_bedrock":
            if boto3 is None:
                raise ValueError("boto3 required for aws_bedrock provider")
            region = settings.AWS_BEDROCK_REGION or settings.AWS_REGION
            if not region:
                raise ValueError("Set AWS_BEDROCK_REGION or AWS_REGION")
            if not self.bedrock_model_id:
                raise ValueError("Set AWS_BEDROCK_MODEL_ID")
            self.bedrock_client = boto3.client("bedrock-runtime", region_name=region)
        elif self.provider == "groq":
            # Groq will be called via fallback chain, no client init required
            pass
        elif self.provider == "fallback":
            pass
        else:
            raise ValueError("AI_PROVIDER must be openai, groq, aws_bedrock, or fallback")

    def generate_mode_cards(self, preferences: Optional[Dict[str, Any]] = None) -> List[Dict[str, Any]]:
        prompt = (
            "Generate 4 interview mode cards as JSON array. "
            "Allowed modes: DSA, HR, BEHAVIORAL, SYSTEM_DESIGN. "
            "Each item must have: mode, title, subtitle, description, difficulty_start (1-5). "
            "Keep each description under 90 chars."
        )
        if preferences:
            prompt += f" User preferences: {self._safe_json(preferences)}"

        try:
            data = self._generate_json(prompt)
            cards = data if isinstance(data, list) else data.get("cards", [])
            valid = []
            for c in cards:
                mode = str(c.get("mode", "")).upper()
                if mode not in {m.value for m in InterviewMode}:
                    continue
                valid.append(
                    {
                        "mode": mode,
                        "title": c.get("title", mode),
                        "subtitle": c.get("subtitle", "Interview Practice"),
                        "description": c.get("description", "Practice this interview type."),
                        "difficulty_start": int(c.get("difficulty_start", 3)),
                    }
                )
            if valid:
                return valid[:4]
        except Exception as e:
            logger.warning(f"Falling back to default mode cards: {e}")

        return DEFAULT_MODE_CARDS

    def generate_question(
        self,
        mode: InterviewMode,
        difficulty: int,
        preferences: Optional[Dict[str, Any]] = None,
        previous_improvements: Optional[List[str]] = None,
    ) -> str:
        prompt = (
            "Generate one interview question as plain text only. "
            f"Mode: {mode.value}. Difficulty: {difficulty}/5. "
            "Keep it realistic, concise, and answerable in 2-4 minutes."
        )
        if preferences:
            prompt += f" Preferences: {self._safe_json(preferences)}"
        if previous_improvements:
            prompt += f" Focus on these improvement areas: {self._safe_json(previous_improvements[:3])}"

        try:
            if self.provider == "openai":
                response = self.openai_client.chat.completions.create(
                    model=self.model,
                    messages=[
                        {"role": "system", "content": "You generate interview questions."},
                        {"role": "user", "content": prompt},
                    ],
                    temperature=0.7,
                    timeout=settings.AI_TIMEOUT_SEC,
                )
                text = (response.choices[0].message.content or "").strip()
                if text:
                    return text
            if self.provider == "aws_bedrock":
                return self._invoke_bedrock_text(prompt)
            raise RuntimeError("AI provider unavailable")
        except Exception as e:
            logger.warning(f"AI question generation failed, using fallback: {e}")
            return self._fallback_question(mode, difficulty)

    def generate_preparation_plan(
        self,
        topics: List[str],
        preferences: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        prompt = (
            "Create a preparation roadmap in JSON with key 'sections'. "
            "Each section: title, tasks (array of 3-5 actionable items), outcomes (array of 2). "
            f"Topics: {self._safe_json(topics)}"
        )
        if preferences:
            prompt += f" Preferences: {self._safe_json(preferences)}"

        try:
            data = self._generate_json(prompt)
            if isinstance(data, dict) and isinstance(data.get("sections"), list):
                return data
        except Exception as e:
            logger.warning(f"AI preparation plan failed, using fallback: {e}")

        return {
            "sections": [
                {
                    "title": "Core Topics",
                    "tasks": [f"Revise fundamentals of {t}" for t in topics[:3]] or ["Revise fundamentals"],
                    "outcomes": ["Solid conceptual clarity", "Faster response quality"],
                }
            ]
        }

    def generate_concept_learning(self, concept: str) -> Dict[str, Any]:
        """Generate detailed learning material for a concept including definition, 
        explanation, examples, and interview questions with answers."""
        prompt = (
            f"Generate comprehensive learning material for '{concept}' as JSON with keys: "
            "'definition' (1-2 sentences), 'explanation' (detailed 3-5 paragraph explanation), "
            "'key_points' (array of 4-6 important points), 'examples' (array of 2-3 real-world examples), "
            "'interview_questions' (array of 3-4 realistic interview questions with the 'question' and 'answer' key). "
            "Make content detailed, professional, and suitable for interview preparation. "
            "Return valid JSON only."
        )

        try:
            data = self._generate_json(prompt)
            if isinstance(data, dict):
                # Ensure required fields exist
                required_fields = ["definition", "explanation", "key_points", "examples", "interview_questions"]
                for field in required_fields:
                    if field not in data:
                        data[field] = self._fallback_concept_learning().get(field, [])
                return data
        except Exception as e:
            logger.warning(f"AI concept learning generation failed, using fallback: {e}")

        return self._fallback_concept_learning()

    def generate_suggested_topics(
        self, 
        experience_level: str = "intermediate",
        preferred_roles: Optional[List[str]] = None,
        tech_stack: Optional[List[str]] = None
    ) -> List[Dict[str, str]]:
        """Generate AI-suggested topics for preparation based on user profile."""
        prompt = (
            "Generate 5-7 interview preparation topics as JSON array. "
            "Each topic has 'name' and 'description' (max 80 chars). "
            f"Experience level: {experience_level}. "
        )
        if preferred_roles:
            prompt += f"Target roles: {', '.join(preferred_roles)}. "
        if tech_stack:
            prompt += f"Tech stack: {', '.join(tech_stack)}. "

        prompt += (
            "Focus on practical, relevant topics. Return valid JSON array only."
        )

        try:
            data = self._generate_json(prompt)
            topics = data if isinstance(data, list) else data.get("topics", [])
            if isinstance(topics, list) and len(topics) > 0:
                return topics[:7]
        except Exception as e:
            logger.warning(f"AI topic suggestion failed, using fallback: {e}")

        return self._fallback_suggested_topics(preferred_roles, tech_stack)

    def _generate_json(self, prompt: str) -> Any:
        if self.provider == "openai":
            response = self.openai_client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "Return valid JSON only."},
                    {"role": "user", "content": prompt},
                ],
                response_format={"type": "json_object"},
                temperature=0.4,
                timeout=settings.AI_TIMEOUT_SEC,
            )
            content = (response.choices[0].message.content or "{}").strip()
            return json.loads(content)

        if self.provider == "groq":
            # Primary Groq path
            try:
                data = self._fallback_groq_json(prompt)
                if data is not None:
                    logger.info("Using groq provider for JSON generation")
                    return data
            except Exception as e:
                logger.warning(
                    "Groq JSON generation failed, trying fallback providers: %s", e
                )
                return self._call_fallback_json(prompt)

        if self.provider != "aws_bedrock":
            raise RuntimeError("AI provider unavailable")

        # Primary path: AWS Bedrock JSON generation
        try:
            content = self._invoke_bedrock_text(
                "Return valid JSON only, no markdown. " + prompt
            )
            cleaned = content.strip()
            if cleaned.startswith("```"):
                cleaned = cleaned.strip("`")
                if cleaned.lower().startswith("json"):
                    cleaned = cleaned[4:].strip()
            return json.loads(cleaned)
        except Exception as e:
            logger.warning(
                "Bedrock JSON generation failed, trying fallback providers: %s",
                e,
            )
            return self._call_fallback_json(prompt)

    def _call_fallback_json(self, prompt: str) -> Any:
        """Fallback chain: GROQ -> Gemini -> OpenAI (HTTP)"""
        last_error: Optional[Exception] = None
        for provider_name, caller in [
            ("groq", self._fallback_groq_json),
            ("gemini", self._fallback_gemini_json),
            ("openai", self._fallback_openai_json_http),
        ]:
            try:
                data = caller(prompt)
                if data is not None:
                    logger.info("Using %s provider for JSON generation", provider_name)
                    return data
            except Exception as provider_err:
                last_error = provider_err
                logger.error(
                    "%s JSON fallback provider failed: %s",
                    provider_name,
                    str(provider_err),
                )

        if last_error:
            raise last_error
        raise RuntimeError("No JSON-capable provider available")

    def _fallback_groq_json(self, prompt: str) -> Optional[Any]:
        """Generate JSON using GROQ's OpenAI-compatible API.

        Returns None if GROQ is not configured.
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
                    "role": "system",
                    "content": (
                        "You are a JSON-only API. Always return a single valid JSON object "
                        "with no markdown, no prose, and no code fences."
                    ),
                },
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.4,
            "max_tokens": 800,
            # Many Groq models support OpenAI-style response_format for JSON output
            "response_format": {"type": "json_object"},
        }

        response = requests.post(
            url, headers=headers, json=payload, timeout=settings.AI_TIMEOUT_SEC
        )
        response.raise_for_status()
        data = response.json()
        choices = data.get("choices") or []
        if not choices:
            return None
        raw_content = (choices[0]["message"]["content"] or "{}").strip()

        # Be tolerant of minor formatting issues: strip code fences / leading labels
        cleaned = raw_content
        if cleaned.startswith("```"):
            cleaned = cleaned.strip("`")
            if cleaned.lower().startswith("json"):
                cleaned = cleaned[4:].strip()

        # If the model wrapped JSON in prose, try to extract the first JSON object
        cleaned = cleaned.strip()
        if not cleaned.startswith("{"):
            start = cleaned.find("{")
            end = cleaned.rfind("}")
            if start != -1 and end != -1 and end > start:
                cleaned = cleaned[start : end + 1]

        try:
            return json.loads(cleaned or "{}")
        except json.JSONDecodeError as e:
            logger.warning("Groq returned non-JSON content, skipping: %s", e)
            return None

    def _fallback_gemini_json(self, prompt: str) -> Optional[Any]:
        """Generate JSON using Google Gemini.

        Returns None if Gemini is not configured.
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
                        {"text": "Return valid JSON only."},
                        {"text": prompt},
                    ]
                }
            ]
        }

        response = requests.post(
            url, json=payload, timeout=settings.AI_TIMEOUT_SEC
        )
        response.raise_for_status()
        body = response.json()
        candidates = body.get("candidates") or []
        if not candidates:
            return None
        content = candidates[0].get("content", {})
        parts = content.get("parts") or []
        texts = [p.get("text", "") for p in parts if isinstance(p, dict)]
        text = "".join(texts).strip() or "{}"
        return json.loads(text)

    def _fallback_openai_json_http(self, prompt: str) -> Optional[Any]:
        """Generate JSON using OpenAI's HTTP API directly.

        This is used as a fallback even when the main provider is Bedrock.
        Returns None if OpenAI is not configured.
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
                {"role": "system", "content": "Return valid JSON only."},
                {"role": "user", "content": prompt},
            ],
            "temperature": 0.4,
            "max_tokens": 800,
        }

        response = requests.post(
            url, headers=headers, json=payload, timeout=settings.AI_TIMEOUT_SEC
        )
        response.raise_for_status()
        data = response.json()
        choices = data.get("choices") or []
        if not choices:
            return None
        content = (choices[0]["message"]["content"] or "{}").strip()
        return json.loads(content)

    def _invoke_bedrock_text(self, prompt: str) -> str:
        model_id = self.bedrock_model_id

        if model_id.startswith("anthropic."):
            payload = {
                "anthropic_version": "bedrock-2023-05-31",
                "max_tokens": settings.AWS_BEDROCK_MAX_TOKENS,
                "temperature": 0.6,
                "messages": [{"role": "user", "content": prompt}],
            }
            response = self.bedrock_client.invoke_model(
                modelId=model_id,
                contentType="application/json",
                accept="application/json",
                body=json.dumps(payload),
            )
            data = json.loads(response["body"].read())
            return "".join(
                p.get("text", "") for p in data.get("content", []) if isinstance(p, dict)
            )

        if model_id.startswith("amazon.titan"):
            payload = {
                "inputText": prompt,
                "textGenerationConfig": {
                    "maxTokenCount": settings.AWS_BEDROCK_MAX_TOKENS,
                    "temperature": 0.6,
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
            return results[0].get("outputText", "") if results else ""

        raise ValueError("Unsupported Bedrock model family")

    def _safe_json(self, value: Any) -> str:
        """Serialize data for prompts without crashing on datetime-like fields."""
        return json.dumps(value, default=self._json_default)

    @staticmethod
    def _json_default(value: Any):
        if isinstance(value, (datetime, date)):
            return value.isoformat()
        return str(value)

    def _fallback_question(self, mode: InterviewMode, difficulty: int) -> str:
        if mode == InterviewMode.DSA:
            return {
                1: "How would you reverse a string?",
                2: "How would you check if a string is palindrome?",
                3: "Find first non-repeating character efficiently.",
                4: "Design LRU cache with O(1) operations.",
                5: "Design a streaming top-k frequent elements system.",
            }.get(difficulty, "Explain your approach to solving a medium-level DSA problem.")
        if mode == InterviewMode.SYSTEM_DESIGN:
            return {
                1: "Design a URL shortener at high level.",
                2: "Design a scalable notification service.",
                3: "Design a chat service for 1M daily users.",
                4: "Design real-time analytics for event ingestion.",
                5: "Design a global video delivery platform.",
            }.get(difficulty, "Design a scalable backend for a popular application.")
        if mode == InterviewMode.HR:
            return {
                1: "Tell me about yourself.",
                2: "Why this role?",
                3: "Describe a project challenge and your approach.",
                4: "Tell me about a conflict and how you handled it.",
                5: "Tell me about a high-impact decision you made.",
            }.get(difficulty, "Describe a recent achievement and its impact.")
        return {
            1: "How do you handle feedback?",
            2: "Describe a time you learned quickly.",
            3: "Tell me about a failure and your learning.",
            4: "How do you prioritize when everything is urgent?",
            5: "Describe influencing without authority.",
        }.get(difficulty, "Describe a behavioral scenario you handled well.")

    @staticmethod
    def _fallback_concept_learning() -> Dict[str, Any]:
        """Fallback learning material when AI is unavailable."""
        return {
            "definition": "A fundamental concept in software development and system design.",
            "explanation": "This is a core concept that requires understanding at both theoretical and practical levels. "
                          "It involves learning foundational principles, understanding how different components interact, "
                          "and being able to apply this knowledge to solve real-world problems. Study the basics thoroughly, "
                          "practice with examples, and then focus on advanced use cases.",
            "key_points": [
                "Understand the core principles and fundamentals",
                "Learn how this concept is applied in real-world systems",
                "Practice with multiple examples and scenarios",
                "Focus on edge cases and potential pitfalls",
                "Understand trade-offs and when to apply this concept",
                "Study best practices and common patterns"
            ],
            "examples": [
                "Real-world application example 1: How this concept is used in production systems",
                "Real-world application example 2: A common use case you might encounter in interviews",
                "Real-world application example 3: Advanced application demonstrating deeper understanding"
            ],
            "interview_questions": [
                {
                    "question": "Can you explain this concept and its importance?",
                    "answer": "This concept is important because it forms the foundation for scalable and efficient systems. "
                             "For example, understanding this allows you to make better architectural decisions."
                },
                {
                    "question": "What are the key trade-offs you should consider?",
                    "answer": "When deciding to use this approach, consider performance vs complexity and maintainability. "
                             "The best choice depends on your specific system requirements."
                },
                {
                    "question": "How would you implement or use this in a real system?",
                    "answer": "In production systems, you implement this by... focusing on the core requirements and gradually "
                             "optimizing based on actual performance metrics."
                },
                {
                    "question": "What's a common mistake people make with this concept?",
                    "answer": "A common mistake is over-engineering or under-engineering the solution without understanding "
                             "the actual requirements. Always measure and optimize based on real data."
                }
            ]
        }

    @staticmethod
    def _fallback_suggested_topics(
        preferred_roles: Optional[List[str]] = None,
        tech_stack: Optional[List[str]] = None
    ) -> List[Dict[str, str]]:
        """Fallback suggested topics when AI is unavailable."""
        default_topics = [
            {"name": "Data Structures", "description": "Arrays, Linked Lists, Trees, Graphs, Hash Tables - Fundamental building blocks"},
            {"name": "Algorithms & Complexity", "description": "Sorting, Searching, DP, Time/Space complexity analysis"},
            {"name": "System Design", "description": "Scalability, Load Balancing, Caching, Databases - Large-scale design"},
            {"name": "Object-Oriented Design", "description": "SOLID principles, Design Patterns, OOP concepts"},
            {"name": "Database Design", "description": "SQL, NoSQL, Indexing, Transactions, Optimization"},
            {"name": "Communication & Soft Skills", "description": "STAR method, Teamwork, Conflict resolution, Leadership"},
        ]
        
        if preferred_roles and isinstance(preferred_roles, list):
            roles_str = " ".join(preferred_roles).lower()
            if "frontend" in roles_str or "full" in roles_str:
                default_topics.extend([
                    {"name": "Frontend Frameworks", "description": "React/Vue/Angular - Components, State, Hooks"},
                    {"name": "Web Performance", "description": "Rendering optimization, Network optimization, Caching"},
                ])
            if "backend" in roles_str or "full" in roles_str:
                default_topics.extend([
                    {"name": "REST APIs & Microservices", "description": "API design, Microservices architecture, Best practices"},
                ])
        
        if tech_stack and isinstance(tech_stack, list):
            tech_str = " ".join(tech_stack).lower()
            if "aws" in tech_str:
                default_topics.append(
                    {"name": "AWS Services", "description": "EC2, S3, Lambda, RDS, DynamoDB - Core AWS essentials"}
                )
            if "docker" in tech_str or "kubernetes" in tech_str:
                default_topics.append(
                    {"name": "Containerization & Orchestration", "description": "Docker, Kubernetes - Container basics and deployment"}
                )
        
        return default_topics[:7]
