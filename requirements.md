# Interview Prep Buddy – Requirements Document

## 1. Functional Requirements

### FR-1: User Authentication

- Users must be able to log in securely
- Sessions should be managed safely

### FR-2: Interview Type Selection

- Users can select between DSA and HR interviews

### FR-3: AI Question Generation

- System should generate relevant interview questions
- Questions should align with selected interview type

### FR-4: Voice-Based Answer Input

- Users can answer questions using voice input
- System must capture and process audio input

### FR-5: Speech-to-Text Conversion

- Voice input must be converted into text accurately

### FR-6: AI Evaluation

- System must evaluate:
  - Reasoning and logic flow
  - Correctness of approach
  - Communication clarity
  - Time and space complexity (for DSA)

### FR-7: Structured Feedback

- Feedback must be generated in a clear and structured format
- Suggestions for improvement must be provided

### FR-8: Adaptive Interview Flow

- System must adjust question difficulty based on user performance

### FR-9: Performance Summary

- System should provide an interview summary at the end

---

## 2. Non-Functional Requirements

### NFR-1: Usability

- Interface must be simple and intuitive
- Suitable for beginners and non-technical users

### NFR-2: Performance

- AI feedback should be generated within acceptable response time

### NFR-3: Scalability

- System should scale with increased users and interviews

### NFR-4: Reliability

- System should handle failures gracefully (API errors, network issues)

### NFR-5: Security

- Secure authentication and data handling
- No permanent storage of voice data

---

## 3. AI-Specific Requirements

### AI-1: Meaningful Use of AI

- AI must be central to evaluation and decision-making
- AI must not be used only as a chatbot or rule-based checker

### AI-2: Justification of AI Usage

- Open-ended interview answers require AI-level language understanding
- Rule-based systems are insufficient

### AI-3: Responsible AI

- Constructive feedback only
- Bias reduction using reference solutions
- No misuse of user data

---

## 4. Technical Requirements

- Frontend: Web or Mobile Application
- Backend: API-based server
- AI Services:
  - Large Language Model (LLM)
  - Speech-to-Text API
- Database:
  - Questions
  - Gold-standard solutions
  - User performance data
- Cloud hosting using free-tier services

---

## 5. Constraints

- Hackathon time limits
- Limited API usage (free tiers / credits)
- Prototype-level implementation

---

## 6. Assumptions

- Users have microphone access
- Internet connectivity is available
- Demo-scale usage during hackathon