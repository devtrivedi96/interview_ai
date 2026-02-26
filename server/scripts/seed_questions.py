"""
Seed initial questions into the datastore
Run this script to populate the question bank
"""
import sys
sys.path.append('src')

from db.aws_client import get_db, Collections
from db.models import Question, InterviewMode


def seed_questions():
    """Seed initial question bank"""
    db = get_db()
    
    questions = [
        # DSA Questions - Easy (1-2)
        Question(
            id="",
            mode=InterviewMode.DSA,
            difficulty=1,
            question_text="Explain how you would reverse a string in your preferred programming language.",
            reference_answer="Use two pointers or built-in reverse. Time: O(n), Space: O(1) or O(n).",
            tags=["strings", "basics"]
        ),
        Question(
            id="",
            mode=InterviewMode.DSA,
            difficulty=2,
            question_text="How would you check if a string is a palindrome? Discuss time and space complexity.",
            reference_answer="Compare from both ends. Time: O(n), Space: O(1).",
            tags=["strings", "two-pointers"]
        ),
        
        # DSA Questions - Medium (3)
        Question(
            id="",
            mode=InterviewMode.DSA,
            difficulty=3,
            question_text="Design an algorithm to find the longest palindromic substring in a given string.",
            reference_answer="Expand around center or DP. Time: O(n²), Space: O(1) or O(n²).",
            tags=["strings", "dynamic-programming"]
        ),
        Question(
            id="",
            mode=InterviewMode.DSA,
            difficulty=3,
            question_text="Implement a function to detect a cycle in a linked list.",
            reference_answer="Floyd's cycle detection (slow/fast pointers). Time: O(n), Space: O(1).",
            tags=["linked-list", "two-pointers"]
        ),
        
        # DSA Questions - Hard (4-5)
        Question(
            id="",
            mode=InterviewMode.DSA,
            difficulty=4,
            question_text="Find the median of two sorted arrays. Optimize for time complexity.",
            reference_answer="Binary search on smaller array. Time: O(log(min(m,n))), Space: O(1).",
            tags=["arrays", "binary-search"]
        ),
        Question(
            id="",
            mode=InterviewMode.DSA,
            difficulty=5,
            question_text="Design a data structure that supports insert, delete, and getRandom in O(1) time.",
            reference_answer="HashMap + ArrayList. HashMap stores value->index, ArrayList stores values.",
            tags=["data-structures", "design"]
        ),
        
        # HR Questions - Easy (1-2)
        Question(
            id="",
            mode=InterviewMode.HR,
            difficulty=1,
            question_text="Tell me about yourself and your background.",
            reference_answer="Brief professional summary, key experiences, current goals.",
            tags=["introduction", "basics"]
        ),
        Question(
            id="",
            mode=InterviewMode.HR,
            difficulty=2,
            question_text="Why are you interested in this role?",
            reference_answer="Connect interests with role requirements and company mission.",
            tags=["motivation", "fit"]
        ),
        
        # HR Questions - Medium (3)
        Question(
            id="",
            mode=InterviewMode.HR,
            difficulty=3,
            question_text="Describe a challenging project you worked on and how you overcame obstacles.",
            reference_answer="STAR format with specific metrics and outcomes.",
            tags=["problem-solving", "star"]
        ),
        Question(
            id="",
            mode=InterviewMode.HR,
            difficulty=3,
            question_text="Tell me about a time you had to work with a difficult team member.",
            reference_answer="Show empathy, communication, conflict resolution, positive outcome.",
            tags=["teamwork", "conflict"]
        ),
        
        # HR Questions - Hard (4-5)
        Question(
            id="",
            mode=InterviewMode.HR,
            difficulty=4,
            question_text="Describe a situation where you had to make a difficult decision with incomplete information.",
            reference_answer="Show analytical thinking, risk assessment, stakeholder management.",
            tags=["decision-making", "leadership"]
        ),
        Question(
            id="",
            mode=InterviewMode.HR,
            difficulty=5,
            question_text="Tell me about a time you failed and how you handled it.",
            reference_answer="Show vulnerability, learning, growth, and how you applied lessons.",
            tags=["failure", "growth-mindset"]
        ),
        
        # Behavioral Questions
        Question(
            id="",
            mode=InterviewMode.BEHAVIORAL,
            difficulty=2,
            question_text="How do you handle feedback and criticism?",
            reference_answer="Show openness, growth mindset, specific examples of improvement.",
            tags=["feedback", "growth"]
        ),
        Question(
            id="",
            mode=InterviewMode.BEHAVIORAL,
            difficulty=3,
            question_text="Describe a time when you had to influence others without authority.",
            reference_answer="Show persuasion, collaboration, and impact.",
            tags=["influence", "leadership"]
        ),
    ]
    
    # Add questions to Firestore
    questions_ref = db.collection(Collections.QUESTIONS)
    count = 0
    
    for question in questions:
        doc_ref = questions_ref.document()
        question.id = doc_ref.id
        doc_ref.set(question.to_dict())
        count += 1
        print(f"✓ Added: [{question.mode.value}] {question.question_text[:60]}...")
    
    print(f"\n✅ Successfully seeded {count} questions!")


if __name__ == "__main__":
    seed_questions()
