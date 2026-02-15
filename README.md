# Interview Prep Buddy

AI-powered mock interview platform for technical (DSA) and HR preparation.

## Features Implemented

### Backend (FastAPI + Firebase)
- ✅ User authentication (register/login with JWT)
- ✅ Firebase Firestore database
- ✅ Interview session management
- ✅ Question generation and adaptive difficulty
- ✅ AI-powered answer evaluation with rubric scoring
- ✅ Speech-to-text integration (OpenAI Whisper)
- ✅ Session summary and analytics
- ✅ User progress tracking
- ✅ State machine for interview flow
- ✅ Structured feedback (strengths/improvements)

### Frontend (Next.js)
- ✅ Landing page with mode selection
- ✅ Authentication pages (login/register)
- ✅ Interview interface with voice recording
- ✅ Real-time feedback display
- ✅ Progress dashboard
- ✅ Responsive design with Tailwind CSS

## Architecture

```
interview-prep-buddy/
├── server/              # FastAPI backend
│   ├── api/routes/      # API endpoints
│   ├── core/            # Config and security
│   ├── db/              # Firebase models
│   ├── services/        # Business logic
│   └── schemas/         # Pydantic schemas
├── client/              # Next.js frontend
│   └── app/             # App router pages
└── docs/                # Design documents
```

## Quick Start

### Backend Setup

1. Install dependencies:
```bash
cd server
pip install -r requirements.txt
```

2. Set up Firebase:
   - Create a Firebase project at https://console.firebase.google.com
   - Enable Firestore Database
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save the JSON file as `firebase-credentials.json` in the server directory

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your credentials
```

Required environment variables:
```
FIREBASE_CREDENTIALS_PATH=firebase-credentials.json
SECRET_KEY=your-secret-key-here
OPENAI_API_KEY=your-openai-api-key
```

4. Seed questions:
```bash
python seed_questions.py
```

5. Run server:
```bash
uvicorn main:app --reload
```

API will be available at `http://localhost:8000`

### Frontend Setup

1. Install dependencies:
```bash
cd client
npm install
```

2. Configure environment:
```bash
cp .env.local.example .env.local
```

Edit `.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

3. Run development server:
```bash
npm run dev
```

Frontend will be available at `http://localhost:3000`

## Firebase Collections Structure

### users
```
{
  email: string
  hashed_password: string
  created_at: timestamp
}
```

### sessions
```
{
  user_id: string
  mode: "DSA" | "HR"
  difficulty_start: number
  difficulty_end: number
  total_score: number
  duration_sec: number
  state: string
  created_at: timestamp
  completed_at: timestamp
}
```

### questions
```
{
  mode: "DSA" | "HR"
  difficulty: number (1-5)
  question_text: string
  reference_answer: string
  metadata: object
  created_at: timestamp
}
```

### session_questions
```
{
  session_id: string
  question_id: string
  question_text: string
  difficulty: number
  transcript: string
  latency_ms: number
  created_at: timestamp
}
```

### answer_evaluations
```
{
  session_question_id: string
  score_dimension_1: number
  score_dimension_2: number
  score_dimension_3: number
  score_dimension_4: number
  score_dimension_5: number
  composite_score: number
  strengths_json: array
  improvements_json: array
  next_question_strategy: string
  confidence: number
  created_at: timestamp
}
```

## API Endpoints

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/sessions` - Create interview session
- `POST /api/v1/sessions/{id}/questions/next` - Get next question
- `POST /api/v1/sessions/{id}/answers` - Submit answer
- `GET /api/v1/sessions/{id}/summary` - Get session summary
- `GET /api/v1/users/me/progress` - Get user progress

## Core Features

### Interview State Machine
- IDLE → INIT → ASK_QUESTION → CAPTURE_AUDIO → TRANSCRIBE → EVALUATE → DELIVER_FEEDBACK → ADAPT → COMPLETE

### Scoring Framework
Each answer scored 0-5 on 5 dimensions:

**DSA:**
1. Problem Understanding
2. Approach Quality
3. Correctness Reasoning
4. Complexity Analysis
5. Communication Clarity

**HR:**
1. Relevance
2. Structure (STAR format)
3. Specific Evidence
4. Self-Awareness
5. Communication Clarity

### Adaptive Difficulty
- Average score ≥ 4.0 → Increase difficulty
- Average score ≤ 2.0 → Decrease difficulty
- Otherwise → Maintain difficulty

## Tech Stack

- **Backend:** FastAPI, Firebase Firestore
- **Frontend:** Next.js 14, React, Tailwind CSS
- **AI:** OpenAI GPT-4 for evaluation, Whisper for STT
- **Auth:** JWT with bcrypt password hashing

## Firebase Setup Guide

1. Create Firebase Project:
   - Go to https://console.firebase.google.com
   - Click "Add project"
   - Follow the setup wizard

2. Enable Firestore:
   - In Firebase Console, go to "Firestore Database"
   - Click "Create database"
   - Start in production mode
   - Choose a location

3. Set up Authentication (optional for Firebase Auth):
   - Go to "Authentication"
   - Enable Email/Password provider

4. Get Service Account Key:
   - Go to Project Settings (gear icon)
   - Select "Service accounts" tab
   - Click "Generate new private key"
   - Save as `firebase-credentials.json`

5. Firestore Security Rules (for production):
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null;
    }
    match /questions/{questionId} {
      allow read: if request.auth != null;
    }
    match /session_questions/{questionId} {
      allow read, write: if request.auth != null;
    }
    match /answer_evaluations/{evalId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Performance Targets

- p95 question generation: ≤ 4s
- p95 answer evaluation: ≤ 6s
- Session completion rate: ≥ 98%

## Deployment

### Backend
Deploy to:
- Google Cloud Run (recommended for Firebase)
- Render
- Railway
- Fly.io

### Frontend
Deploy to:
- Vercel (recommended)
- Netlify
- Firebase Hosting

## License

MIT
