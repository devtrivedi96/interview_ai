"""
Seed initial questions into Firebase Firestore
"""
from db.firebase import init_firebase, get_db
from db.models_firebase import Question, InterviewMode


def seed_questions():
    """Seed initial question bank"""
    init_firebase()
    db = get_db()
    
    questions_data = [
        # DSA Questions
        {
            "mode": InterviewMode.DSA,
            "difficulty": 1,
            "question_text": "Explain how you would reverse a string in your preferred programming language.",
            "reference_answer": "Use two pointers or built-in reverse methods. Time: O(n), Space: O(1) or O(n)."
        },
        {
            "mode": InterviewMode.DSA,
            "difficulty": 2,
            "question_text": "How would you check if a string is a palindrome?",
            "reference_answer": "Compare characters from both ends moving inward. Time: O(n), Space: O(1)."
        },
        {
            "mode": InterviewMode.DSA,
            "difficulty": 3,
            "question_text": "Design an algorithm to find the longest palindromic substring in a given string.",
            "reference_answer": "Expand around center approach or dynamic programming. Time: O(n²), Space: O(1) or O(n²)."
        },
        {
            "mode": InterviewMode.DSA,
            "difficulty": 4,
            "question_text": "Implement a function to find the median of two sorted arrays.",
            "reference_answer": "Binary search on smaller array. Time: O(log(min(m,n))), Space: O(1)."
        },
        {
            "mode": InterviewMode.DSA,
            "difficulty": 5,
            "question_text": "Design a data structure that supports insert, delete, and getRandom in O(1) time.",
            "reference_answer": "Use HashMap + ArrayList combination. HashMap stores value->index, ArrayList stores values."
        },
        
        # HR Questions
        {
            "mode": InterviewMode.HR,
            "difficulty": 1,
            "question_text": "Tell me about yourself and your background.",
            "reference_answer": "Brief professional summary, key experiences, current goals."
        },
        {
            "mode": InterviewMode.HR,
            "difficulty": 2,
            "question_text": "Why are you interested in this role?",
            "reference_answer": "Connect personal interests with role requirements and company mission."
        },
        {
            "mode": InterviewMode.HR,
            "difficulty": 3,
            "question_text": "Describe a challenging project you worked on and how you overcame obstacles.",
            "reference_answer": "Use STAR format: Situation, Task, Action, Result with specific metrics."
        },
        {
            "mode": InterviewMode.HR,
            "difficulty": 4,
            "question_text": "Tell me about a time when you had to work with a difficult team member.",
            "reference_answer": "Show empathy, communication skills, conflict resolution, and positive outcome."
        },
        {
            "mode": InterviewMode.HR,
            "difficulty": 5,
            "question_text": "Describe a situation where you had to make a difficult decision with incomplete information.",
            "reference_answer": "Show analytical thinking, risk assessment, stakeholder management, and learning."
        },
    ]
    
    questions_ref = db.collection('questions')
    
    for q_data in questions_data:
        doc_ref = questions_ref.document()
        question = Question(
            id=doc_ref.id,
            mode=q_data["mode"],
            difficulty=q_data["difficulty"],
            question_text=q_data["question_text"],
            reference_answer=q_data["reference_answer"]
        )
        doc_ref.set(question.to_dict())
    
    print(f"✓ Seeded {len(questions_data)} questions to Firebase")


if __name__ == "__main__":
    seed_questions()
