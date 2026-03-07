---
inclusion: always
---

# Interview AI - Project Context

## Project Overview

Interview AI is a full-stack web application that helps users practice technical interviews through AI-powered mock interview sessions. The system provides real-time feedback, speech-to-text transcription, and detailed analytics.

## Tech Stack

### Frontend (Client)
- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **State Management**: Zustand with persistence
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **HTTP Client**: Axios

### Backend (Server)
- **Framework**: FastAPI (Python)
- **Authentication**: Firebase Auth
- **Database**: Firebase Firestore
- **AI Services**: OpenAI GPT-4 for evaluation
- **Speech-to-Text**: OpenAI Whisper
- **API Documentation**: Auto-generated with FastAPI

### Infrastructure
- **Authentication**: Firebase Authentication with email/password
- **Database**: Firebase Firestore (NoSQL)
- **File Storage**: Firebase Storage (for audio files)

## Project Structure

```
.
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Page components
│   │   ├── services/      # API and service integrations
│   │   ├── stores/        # Zustand state stores
│   │   └── config/        # Configuration files
│   └── package.json
│
├── server/                # FastAPI backend
│   ├── src/
│   │   ├── auth/         # Authentication logic
│   │   ├── db/           # Database clients and models
│   │   ├── session_engine/ # Interview session management
│   │   ├── ai_evaluator/ # AI evaluation service
│   │   ├── stt_adapter/  # Speech-to-text service
│   │   ├── analytics/    # Analytics endpoints
│   │   └── profile/      # User profile management
│   └── requirements.txt
│
└── .kiro/                # Kiro AI assistant configuration
```

## Key Features

1. **User Authentication**: Firebase-based email/password authentication with email verification
2. **Interview Sessions**: AI-powered mock interview sessions with real-time questions
3. **Speech Recognition**: Audio recording and transcription using OpenAI Whisper
4. **AI Evaluation**: Automated answer evaluation using GPT-4
5. **Analytics Dashboard**: Performance tracking and insights
6. **User Profiles**: Customizable user profiles with preferences

## Development Workflow

### Starting the Application

1. **Server**: `cd server && source .venv/bin/activate && python -m uvicorn src.main:app --reload`
2. **Client**: `cd client && npm run dev`

### Environment Variables

- Server: `server/.env` - Contains Firebase credentials, OpenAI API keys, etc.
- Client: `client/.env` - Contains Firebase config and API URL

### Firebase Setup Required

The application requires Firebase credentials to function:
- Service account JSON file: `server/firebase-credentials.json`
- Firebase project ID: `interview-33adc`
- Email/Password authentication must be enabled in Firebase Console

## Important Notes

- **No Fallback Auth**: The application uses Firebase exclusively - no mock auth or fallbacks
- **Email Verification Required**: Users must verify their email before logging in
- **Audio Consent**: Users must consent to audio recording before interview sessions
- **API Versioning**: All API endpoints are prefixed with `/api/v1`

## Common Tasks

### Adding a New API Endpoint
1. Create route in appropriate module (e.g., `server/src/session_engine/routes.py`)
2. Add authentication dependency if needed: `Depends(get_current_user_firebase)`
3. Update API client in `client/src/services/api.js` if needed

### Adding a New Page
1. Create component in `client/src/pages/`
2. Add route in `client/src/App.jsx`
3. Update navigation in `client/src/components/Layout.jsx`

### Modifying Database Schema
1. Update models in `server/src/db/models.py`
2. Update Firestore collection structure
3. Handle migration if needed (Firestore is schemaless)

## Testing

- Backend tests: `pytest` (when implemented)
- Frontend: Manual testing in development
- API testing: Use FastAPI's auto-generated docs at `http://localhost:8000/docs`

## Security Considerations

- Never commit `firebase-credentials.json`
- Keep API keys in environment variables
- Validate all user inputs
- Use Firebase security rules for Firestore
- Implement rate limiting for production
