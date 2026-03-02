# Interviewbit Platform

An intelligent AI-powered interview preparation system with real-time voice input, speech-to-text transcription, AI-powered question generation, and structured evaluation using AWS Bedrock and Groq APIs.

## 🎯 Core Features

### Interview Experience

- **Adaptive Question Generation** - AI generates contextual interview questions based on session type and difficulty
- **Voice-Driven Interviews** - Real-time voice recording and transcription with browser MediaRecorder API
- **Intelligent Evaluation** - AWS Bedrock (Claude 3 Haiku) evaluates answers with detailed feedback
- **Sequential Interview Flow** - Questions presented one-at-a-time with manual advancement control
- **Answer Tracking** - All user answers stored with transcripts for review and analytics
- **Multi-Modal Input** - Support for both voice and text-based responses

### Dashboard & Analytics

- **Session History** - View all completed interview sessions with scores and metadata
- **Score Tracking** - Final scores calculated from all question evaluations and displayed prominently
- **Q&A Summary** - Review question-by-question feedback with user answers, expected answers, and evaluation scores
- **Performance Analytics** - Charts and statistics showing improvement trends across sessions
- **Theme Support** - Dark/light mode with smooth transitions

### Account Management

- **Firebase Authentication** - Secure email/password authentication with verification
- **User Profiles** - Store preferences, interview history, and analytics
- **Session Management** - Create, track, and review multiple interview sessions

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      Frontend (React + Vite)                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Pages: Interview | Dashboard | Profile | Analytics      │   │
│  │  Components: Recording | Q&A Summary | Charts            │   │
│  │  State: Zustand (auth, profile stores)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────┬──────────────────────────────────────────┘
                         │ HTTP/REST API
┌────────────────────────▼──────────────────────────────────────────┐
│                   Backend (FastAPI)                               │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  Routes: Auth | Sessions | Analytics | Profile           │   │
│  │  Engines: Interview Session Manager | State Machine      │   │
│  │  Services: AI Evaluation | Question Generation | STT      │   │
│  └──────────────────────────────────────────────────────────┘   │
└────────────────────────┬──────────────────────────────────────────┘
                         │
         ┌───────────────┼───────────────┬──────────────┐
         ▼               ▼               ▼              ▼
    Firestore      AWS Bedrock      Groq API    Firebase Auth
    (Database)   (Claude 3 Haiku)  (STT/Fallback) (Authentication)
```

## 📊 Interview Flow

1. **User Authentication** → Email/password login with Firebase
2. **Session Creation** → Select interview type (behavioral, technical, etc.)
3. **Question Generation** → AI generates first question contextually
4. **Voice Recording** → User records answer (browser MediaRecorder)
5. **Transcription** → Speech-to-text conversion (Groq API)
6. **Answer Submission** → Send transcript to backend
7. **AI Evaluation** → AWS Bedrock evaluates answer with structured feedback
8. **Result Display** → Show score (1-5), strengths, improvements
9. **Next Question** → User manually advances to next question
10. **Session Completion** → Calculate total score and save session

## 🗄️ Database Schema

### Collections

**USERS**

```javascript
{
  id: "user_id",
  email: "user@example.com",
  created_at: Timestamp,
  preferences: { theme: "dark", notifications: true },
  audio_consent: boolean
}
```

**SESSIONS**

```javascript
{
  id: "session_id",
  user_id: "user_id",
  mode: "behavioral|technical|coding",
  difficulty: "beginner|intermediate|advanced",
  total_questions: number,
  total_score: number,  // Final score (0-5 range)
  created_at: Timestamp,
  completed_at: Timestamp,
  state: "in_progress|completed"
}
```

**SESSION_QUESTIONS**

```javascript
{
  id: "question_id",
  session_id: "session_id",
  question_text: string,
  difficulty: "beginner|intermediate|advanced",
  expected_answer: string,
  question_number: number
}
```

**ANSWERS**

```javascript
{
  id: "answer_id",
  session_id: "session_id",
  question_id: "question_id",
  user_id: "user_id",
  transcript: string,  // User's transcribed answer
  created_at: Timestamp
}
```

**EVALUATIONS**

```javascript
{
  id: "evaluation_id",
  session_id: "session_id",
  answer_id: "answer_id",
  question_id: "question_id",
  user_id: "user_id",
  score: number,  // 1-5 scale
  feedback: string,
  strengths: [string],
  improvements: [string],
  evaluator: "bedrock",
  created_at: Timestamp
}
```

## 🔌 API Endpoints

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Authenticate with Firebase token
- `POST /api/v1/auth/verify-token` - Verify authentication
- `GET /api/v1/auth/me` - Get current user profile

### Sessions

- `POST /api/v1/sessions` - Create new interview session
- `GET /api/v1/sessions` - List user's sessions with scores
- `GET /api/v1/sessions/{session_id}` - Get session details
- `POST /api/v1/sessions/{session_id}/questions/{question_id}/answer` - Submit answer
- `POST /api/v1/sessions/{session_id}/complete` - Complete session
- `GET /api/v1/sessions/{session_id}/qa-history` - Get Q&A summary with all answers

### Analytics

- `GET /api/v1/analytics/user/{user_id}` - User statistics
- `GET /api/v1/analytics/sessions/{user_id}` - Session history

### Profile

- `GET /api/v1/profile/me` - Get user profile
- `PUT /api/v1/profile/me` - Update user profile

## 🚀 Quick Start (3 Steps)

### Step 1: Backend Setup

```bash
cd server
pip install -r requirements.txt

# Set up credentials
export GOOGLE_APPLICATION_CREDENTIALS="firebase-credentials.json"
export GROQ_API_KEY="your-groq-key"

# Run server
cd src && uvicorn main:app --reload --port 8000
```

### Step 2: Frontend Setup

```bash
cd client
npm install
npm run dev
# Opens http://localhost:5173
```

### Step 3: Configure Firebase

1. Create Firebase project (console.firebase.google.com)
2. Download service account credentials → `server/firebase-credentials.json`
3. Update `client/src/config/firebase.js` with your project config
4. Enable Firestore and Authentication in Firebase Console

## 🔑 Tech Stack

**Frontend**

- React 18 - Modern UI framework
- Vite - Ultra-fast build tool
- Tailwind CSS - Utility-first styling
- Zustand - Lightweight state management
- Recharts - Analytics visualization
- Lucide Icons - Beautiful icons
- Axios - HTTP client

**Backend**

- FastAPI - Modern async Python framework
- Firebase Admin SDK - Auth & Firestore
- Pydantic - Data validation & serialization
- AWS Bedrock - Claude 3 Haiku for evaluation
- Groq API - Speech-to-text transcription
- Python-dotenv - Environment configuration

**Infrastructure**

- Firebase Firestore - NoSQL document database
- Firebase Authentication - Secure user management
- AWS Bedrock - Managed AI/ML service
- Browser MediaRecorder API - Voice capture

## 📋 Prerequisites

- Python 3.9+
- Node.js 18+
- Firebase project with Firestore & Auth
- AWS account (Bedrock access)
- Groq API key

## 🧪 Testing the System

### 1. Register User

```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "TestPass123!",
    "audio_consent": true
  }'
```

### 2. Start Interview Session

```bash
# After login, get Firebase ID token and:
curl -X POST http://localhost:8000/api/v1/sessions \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "mode": "behavioral",
    "difficulty": "intermediate"
  }'
```

### 3. Get Questions

```bash
curl -X GET http://localhost:8000/api/v1/sessions/{session_id} \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

### 4. Submit Answer

```bash
curl -X POST http://localhost:8000/api/v1/sessions/{session_id}/questions/{question_id}/answer \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "transcript": "User transcribed answer text here"
  }'
```

### 5. Complete Session

```bash
curl -X POST http://localhost:8000/api/v1/sessions/{session_id}/complete \
  -H "Authorization: Bearer YOUR_FIREBASE_TOKEN"
```

## 📁 Project Structure

```
aws_project/
├── client/                          # React Frontend
│   ├── src/
│   │   ├── App.jsx                 # Main app & routing
│   │   ├── pages/
│   │   │   ├── Interview.jsx       # Interview interface (voice recording)
│   │   │   ├── Dashboard.jsx       # Session history & scores
│   │   │   ├── QASummary.jsx       # Q&A review with evaluations
│   │   │   ├── Analytics.jsx       # Performance charts
│   │   │   ├── Profile.jsx         # User settings
│   │   │   └── Auth pages/         # Login, Register
│   │   ├── components/             # Reusable UI components
│   │   ├── services/
│   │   │   ├── api.js             # Axios instance & helpers
│   │   │   ├── sessionService.js  # Session API calls
│   │   │   └── analyticsService.js# Analytics API calls
│   │   └── stores/                # Zustand state management
│   └── package.json
│
├── server/                          # FastAPI Backend
│   ├── src/
│   │   ├── main.py                # FastAPI app entry
│   │   ├── auth/
│   │   │   ├── routes.py          # Auth endpoints
│   │   │   ├── firebase_auth.py   # Firebase auth logic
│   │   │   └── security.py        # JWT & token validation
│   │   ├── db/
│   │   │   ├── models.py          # Pydantic models
│   │   │   ├── firebase_client.py # Firestore operations
│   │   │   └── aws_client.py      # AWS Bedrock operations
│   │   ├── session_engine/
│   │   │   ├── routes.py          # Session endpoints
│   │   │   ├── engine.py          # Interview logic
│   │   │   └── state_machine.py   # Session state management
│   │   ├── ai_evaluator/
│   │   │   ├── service.py         # Evaluation service
│   │   │   ├── prompts.py         # LLM prompts
│   │   │   └── content_generator.py# Question generation
│   │   ├── stt_adapter/
│   │   │   └── service.py         # Groq API integration
│   │   ├── analytics/
│   │   │   └── routes.py          # Analytics endpoints
│   │   └── utils/
│   │       └── config.py          # Configuration
│   └── requirements.txt
│
├── README.md                        # This file
├── roadmap.md                       # Feature roadmap
├── tech-stack.md                    # Detailed tech stack
└── more-ideas.diff                  # Future enhancements
```

## 🔐 Environment Variables

### Backend (.env)

```env
# Firebase
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=firebase-credentials.json

# AWS Bedrock
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# Groq API
GROQ_API_KEY=your-groq-key

# Server
SECRET_KEY=your-secret-key
ALGORITHM=HS256
```

### Frontend (.env)

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_API_BASE_URL=http://localhost:8000
```

## 🚀 Production Deployment

### Backend

```bash
# Build
pip install -r requirements.txt
pip install gunicorn

# Deploy on AWS EC2, Google Cloud Run, or similar
gunicorn -w 4 -k uvicorn.workers.UvicornWorker src.main:app
```

### Frontend

```bash
# Build
npm run build

# Deploy to: Vercel, Netlify, Firebase Hosting, or AWS S3 + CloudFront
```

## ⚙️ Configuration

### Enable AWS Bedrock

1. Go to AWS Console → Bedrock
2. Request access to Claude 3 Haiku model
3. Store credentials in `.env`

### Enable Groq API

1. Sign up at groq.com
2. Get API key
3. Set `GROQ_API_KEY` in backend `.env`

### Firebase Setup

1. Create project in Firebase Console
2. Enable Firestore Database
3. Enable Email/Password Authentication
4. Create Service Account & download JSON
5. Add JSON to `server/firebase-credentials.json`

## 🎓 Key Design Decisions

1. **Sequential Interview Flow**: Questions shown one-at-a-time with manual advancement (not auto-scroll) to prevent rushing through answers
2. **Answer Transcripts**: All user answers stored as transcripts for review and analytics
3. **Score Persistence**: Final scores calculated and stored in SESSIONS collection for dashboard display
4. **AI Evaluation**: AWS Bedrock used for reliable, structured feedback (Claude 3 Haiku selected for cost efficiency)
5. **Firestore for Interviews**: NoSQL structure allows flexible question types and evaluation formats

## 🐛 Known Limitations

- Maximum interview session duration: 1 hour
- Speech-to-text accuracy depends on audio quality
- AI evaluation uses Claude 3 Haiku (not full GPT-4, for cost efficiency)
- Offline mode not yet supported

## 🚀 Future Enhancements

- Real-time feedback during answer recording
- Multiple language support
- Video recording + video analysis
- Peer review functionality
- Custom question sets
- Mobile app (React Native)
- Offline mode with sync
- Advanced analytics (skill gap analysis)

## 🤝 Support

For issues, questions, or feature requests, please refer to:

- [Roadmap](roadmap.md) - Planned features
- [Tech Stack Details](tech-stack.md) - Technology choices
- GitHub Issues - Bug reports

## 📄 License

MIT - Feel free to use this project for learning and commercial purposes.
