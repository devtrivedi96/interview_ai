import boto3
import json
import logging
from src.utils.config import settings

logger = logging.getLogger(__name__)


class BedrockService:
    def __init__(self):
        self.client = boto3.client(
            service_name="bedrock-runtime",
            region_name=settings.AWS_REGION
        )
        self.model_id = "anthropic.claude-3-haiku-20240307-v1:0"

    def generate_question(self, mode: str, difficulty: int) -> str:
        prompt = f"""
You are a FAANG-level interviewer.

Generate exactly ONE interview question.

Interview Mode: {mode}
Difficulty Level: {difficulty} (1=easy, 5=very hard)

Rules:
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
            return self._fallback_question(mode, difficulty)

    def _fallback_question(self, mode: str, difficulty: int) -> str:
        """Return a local deterministic fallback question when Bedrock is unavailable."""
        level = max(1, min(5, int(difficulty or 3)))
        mode_key = (mode or "").upper()

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
            "Using fallback question because Bedrock invoke failed "
            f"(mode={mode_key}, difficulty={level})"
        )
        return fallback
