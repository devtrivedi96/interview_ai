# Interviewbit Platform

AI-powered interview practice platform with adaptive questioning, voice input, and structured answer evaluation.

## 1. Problem
Candidates struggle to practice realistic interviews with high-quality, immediate feedback.

## 2. Solution
Interviewbit simulates interview rounds end-to-end:
- Generates contextual questions by interview mode and difficulty
- Captures voice answers and transcribes them
- Evaluates responses with rubric-based AI scoring
- Shows strengths, improvements, and progress analytics

## 3. Key Features
- Adaptive interview flow with one-question-at-a-time state control
- Voice + text answer support
- Automated evaluation with actionable feedback
- Session history, score trends, and profile preferences
- AWS deployment pipeline for frontend delivery

## 4. Architecture
- Frontend: React + Vite + Zustand + Tailwind
- Backend: FastAPI (modular route + engine design)
- Database: DynamoDB (Firestore-compatible access abstraction used in code)
- AI Services: AWS Bedrock (evaluation/question support), STT integration in backend adapters
- Deployment: GitHub Actions -> S3 + CloudFront (client)

## 5. API Surface (Main)
- `POST /api/v1/sessions` create session
- `POST /api/v1/sessions/{session_id}/start` generate first question
- `POST /api/v1/sessions/{session_id}/questions/{question_id}/answer` submit answer
- `POST /api/v1/sessions/{session_id}/complete` complete interview
- `GET /api/v1/sessions` list user sessions
- `GET /api/v1/analytics/*` performance insights

## 6. Local Run
### Backend
```bash
cd server
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

### Frontend
```bash
cd client
npm install
npm run dev
```

## 7. Hackathon Evaluation Notes
- Built for live demo readiness: complete interview loop + scoring + analytics
- Designed with practical deployment path on AWS
- Prioritizes user experience (voice-first flow) and measurable outcomes (scores and trends)
