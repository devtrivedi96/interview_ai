# Interview AI Platform

An AI-powered interview preparation platform with voice recording, real-time transcription, and intelligent feedback using OpenAI GPT-4.

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 18+
- Firebase project with Firestore and Authentication
- OpenAI API key

### Backend Setup

```bash
cd server
pip install -r requirements.txt

# Add your Firebase service account credentials
# Download from Firebase Console > Project Settings > Service Accounts
# Save as: server/firebase-credentials.json

# Set environment variable
export GOOGLE_APPLICATION_CREDENTIALS="firebase-credentials.json"

# Start server
cd src
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
# Runs on http://localhost:5173
```

## ✨ Features

- 🔐 **Firebase Authentication** with email verification
- 🎤 **Voice Recording** with browser MediaRecorder API
- 🗣️ **Speech-to-Text** using OpenAI Whisper
- 🤖 **AI Evaluation** with GPT-4 and structured feedback
- 📊 **Analytics Dashboard** with progress tracking
- 🎯 **Adaptive Difficulty** based on performance
- 🔒 **Privacy Controls** with audio consent management

## 🏗️ Architecture

```
Frontend (React + Vite + Firebase SDK)
    ↓ REST API
Backend (FastAPI + Firebase Admin SDK)
    ↓
Firebase Firestore (Database)
Firebase Auth (Authentication)
OpenAI API (GPT-4 + Whisper)
```

## 📚 Documentation

- [Setup Guide](SETUP_GUIDE.md) - Detailed setup instructions
- [Firebase Auth Setup](FIREBASE_AUTH_SETUP.md) - Authentication configuration
- [Project Structure](PROJECT_STRUCTURE.md) - Code organization
- [Current Status](CURRENT_STATUS.md) - Implementation status

## 🔑 Key Technologies

**Backend:**
- FastAPI - Modern Python web framework
- Firebase Admin SDK - Authentication and Firestore
- OpenAI API - GPT-4 for evaluation, Whisper for STT
- Pydantic - Data validation

**Frontend:**
- React 18 - UI framework
- Vite - Build tool
- Firebase SDK - Client-side authentication
- Zustand - State management
- Tailwind CSS - Styling
- Recharts - Analytics visualization

## 🔐 Authentication Flow

1. User registers with email/password
2. Firebase sends verification email automatically
3. User clicks verification link
4. User logs in (verification checked)
5. Firebase ID token used for API authentication
6. Token auto-refreshed every hour

## 📁 Project Structure

```
interview-ai/
├── server/                 # Backend (FastAPI)
│   ├── src/
│   │   ├── auth/          # Authentication (Firebase)
│   │   ├── db/            # Database (Firestore)
│   │   ├── session_engine/# Interview sessions
│   │   ├── ai_evaluator/  # AI evaluation
│   │   ├── stt_adapter/   # Speech-to-text
│   │   ├── analytics/     # Analytics
│   │   └── main.py        # FastAPI app
│   └── requirements.txt
│
├── client/                # Frontend (React)
│   ├── src/
│   │   ├── pages/        # Page components
│   │   ├── components/   # Reusable components
│   │   ├── stores/       # Zustand stores
│   │   ├── services/     # API client
│   │   └── config/       # Firebase config
│   └── package.json
│
└── docs/                 # Documentation
```

## 🧪 Testing

### Test Registration
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","audio_consent":true}'
```

### Test Login (after email verification)
```bash
# Get Firebase ID token from client
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"id_token":"YOUR_FIREBASE_ID_TOKEN"}'
```

## 🔧 Configuration

### Backend Environment Variables
```env
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=firebase-credentials.json
OPENAI_API_KEY=sk-your-key
SECRET_KEY=your-secret-key
```

### Frontend Firebase Config
Update `client/src/config/firebase.js` with your Firebase project credentials.

## 📊 API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with Firebase token
- `POST /api/v1/auth/verify-token` - Verify authentication
- `POST /api/v1/auth/resend-verification` - Resend verification email
- `GET /api/v1/auth/me` - Get current user

### Sessions
- `POST /api/v1/sessions` - Create interview session
- `GET /api/v1/sessions/{id}` - Get session details
- `POST /api/v1/sessions/{id}/answer` - Submit answer
- `POST /api/v1/sessions/{id}/complete` - Complete session

### Analytics
- `GET /api/v1/analytics/user/{user_id}` - User analytics
- `GET /api/v1/analytics/sessions/{user_id}` - Session history

## 🚀 Deployment

### Backend (Production)
```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
export GOOGLE_APPLICATION_CREDENTIALS=/path/to/credentials.json
export OPENAI_API_KEY=your-key

# Run with gunicorn
gunicorn -w 4 -k uvicorn.workers.UvicornWorker main:app
```

### Frontend (Production)
```bash
# Build
npm run build

# Deploy dist/ folder to:
# - Vercel
# - Netlify
# - Firebase Hosting
# - Any static hosting
```

## 🐛 Troubleshooting

**Firebase Connection Error:**
- Verify `firebase-credentials.json` exists
- Check `GOOGLE_APPLICATION_CREDENTIALS` path
- Ensure Firestore is enabled in Firebase Console

**Email Verification Not Working:**
- Check Firebase Console > Authentication > Templates
- Verify Email/Password provider is enabled
- Check spam folder

**API Connection Error:**
- Verify backend is running on port 8000
- Check CORS settings
- Verify Firebase ID token is valid

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please read the documentation before submitting PRs.

## 📧 Support

For issues or questions, check the documentation or create an issue.
