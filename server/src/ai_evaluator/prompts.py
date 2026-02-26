"""
LLM prompt templates for evaluation
Defines rubrics and evaluation criteria
"""
from db.models import InterviewMode


def get_rubric_dimensions(mode: InterviewMode) -> dict:
    """Get rubric dimensions for interview mode"""
    
    if mode == InterviewMode.DSA:
        return {
            "dimension_1": "Problem Understanding - Did they grasp the problem correctly?",
            "dimension_2": "Approach Quality - Is the solution approach sound and optimal?",
            "dimension_3": "Correctness Reasoning - Did they explain why their solution works?",
            "dimension_4": "Complexity Analysis - Did they discuss time/space complexity accurately?",
            "dimension_5": "Communication Clarity - Was the explanation clear, structured, and easy to follow?"
        }
    
    elif mode == InterviewMode.HR or mode == InterviewMode.BEHAVIORAL:
        return {
            "dimension_1": "Relevance - Does the answer directly address the question?",
            "dimension_2": "Structure - Is it well-organized (STAR format: Situation, Task, Action, Result)?",
            "dimension_3": "Specific Evidence - Are there concrete examples with measurable outcomes?",
            "dimension_4": "Self-Awareness - Do they show reflection, learning, and growth?",
            "dimension_5": "Communication Clarity - Is it clear, professional, and engaging?"
        }
    
    else:  # SYSTEM_DESIGN
        return {
            "dimension_1": "Requirements Gathering - Did they clarify requirements and constraints?",
            "dimension_2": "System Architecture - Is the high-level design sound and scalable?",
            "dimension_3": "Component Design - Are individual components well-designed?",
            "dimension_4": "Trade-offs Discussion - Did they discuss trade-offs and alternatives?",
            "dimension_5": "Communication Clarity - Was the explanation clear and systematic?"
        }


def get_evaluation_prompt(
    mode: InterviewMode,
    question_text: str,
    transcript: str,
    difficulty: int
) -> str:
    """
    Build evaluation prompt for LLM
    
    Returns structured prompt with rubric and output format
    """
    rubric = get_rubric_dimensions(mode)
    
    # Build rubric description
    rubric_text = "\n".join([
        f"{i}. {desc}" for i, desc in enumerate(rubric.values(), 1)
    ])
    
    # Mode-specific guidance
    if mode == InterviewMode.DSA:
        guidance = """
Focus on:
- Correctness of the approach (not just final answer)
- Quality of explanation and reasoning
- Understanding of complexity
- Code structure and edge cases (if code provided)

Do NOT penalize for:
- Minor syntax errors
- Accent or grammar (unless comprehension fails)
- Not providing perfect code (focus on approach)
"""
    else:
        guidance = """
Focus on:
- Specific examples with context
- Clear structure (STAR format)
- Measurable outcomes and impact
- Self-reflection and learning

Do NOT penalize for:
- Accent or grammar (unless comprehension fails)
- Brevity (if key points are covered)
- Informal language (if professional enough)
"""
    
    prompt = f"""You are an expert interview evaluator. Evaluate this interview answer objectively and constructively.

INTERVIEW TYPE: {mode.value}
DIFFICULTY LEVEL: {difficulty}/5
QUESTION: {question_text}

CANDIDATE ANSWER:
{transcript}

EVALUATION RUBRIC (0-5 scale for each dimension):
{rubric_text}

{guidance}

Provide your evaluation in this EXACT JSON format:
{{
    "scores": {{
        "dimension_1": <0-5>,
        "dimension_2": <0-5>,
        "dimension_3": <0-5>,
        "dimension_4": <0-5>,
        "dimension_5": <0-5>
    }},
    "composite_score": <average of all dimensions>,
    "strengths": ["specific strength 1", "specific strength 2"],
    "improvements": ["specific improvement 1", "specific improvement 2"],
    "next_question_strategy": "easier|same|harder",
    "eval_confidence": <0-1, your confidence in this evaluation>
}}

IMPORTANT:
- Be specific and actionable in strengths/improvements
- Each strength/improvement should be 10-200 characters
- Provide 1-5 items for strengths and improvements
- Be constructive and encouraging
- Focus on what was said, not what was missing (unless critical)
"""
    
    return prompt
