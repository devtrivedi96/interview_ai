# Interview AI - Complete Setup Guide

## Prerequisites

- Python 3.9+
- Node.js 18+
- Firebase project with Firestore and Authentication enabled
- OpenAI API key

## Backend Setup

### 1. Install Python Dependencies

```bash
cd server
pip install -r requirements.txt
```

### 2. Configure Firebase

1. Create a Firebase project at https://console.firebase.google.com
2. Enable Firestore Database (in Native mode)
3. Enable Authentication with Email/Password provider
4. Download service account key:
   - Go to Project Settings > Service Accounts
   - Click "Generate New Private Key"
   - Save as `firebase-credentials.json` in `server/` directory
5. Configure email verification settings in Firebase Console

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set:

- `OPENAI_API_KEY` - Your OpenAI API key
- `SECRET_KEY` - Generate with `openssl rand -hex 32`
- `FIREBASE_PROJECT_ID` - Your Firebase project ID
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to firebase-credentials.json

### 4. Seed Questions

```bash
python scripts/seed_questions.py
```

### 5. Run Server

```bash
cd src
uvicorn main:app --reload --port 8000
```

API will be available at: http://localhost:8000
API Docs: http://localhost:8000/docs

## Frontend Setup

### 1. Install Dependencies

```bash
cd client
npm install
```

### 2. Configure Firebase

```bash
cp .env.example .env
```

Edit `.env` and set your Firebase configuration:

```
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
VITE_FIREBASE_MEASUREMENT_ID=your-measurement-id
```

Or update `client/src/config/firebase.js` directly with your Firebase project credentials.

### 3. Run Development Server

```bash
npm run dev
```

App will be available at: http://localhost:3000

## Testing the Application

### 1. Register a New User

1. Go to http://localhost:5173 (Vite default port)
2. Click "Get Started" or "Register"
3. Enter email and password (minimum 6 characters)
4. Check "audio consent" checkbox
5. Click "Create Account"
6. You'll see a success screen with verification instructions
7. Check your email inbox for the verification link
8. Click the verification link in the email

### 2. Login

1. Return to the login page
2. Enter your email and password
3. If email is not verified, you'll see an error with option to resend verification
4. Once verified, you'll be logged in and redirected to the dashboard

### 3. Start an Interview

1. From Dashboard, select interview type (DSA/HR/etc.)
2. Choose difficulty level (1-5)
3. Click "Start Interview"

### 4. Answer Questions

1. Click "Start Recording"
2. Speak your answer clearly
3. Click "Stop Recording"
4. Wait for AI evaluation
5. Review feedback and scores
6. Click "Next Question" or "Complete Session"

### 5. View Analytics

1. Go to Analytics page
2. View score progression
3. See common strengths/improvements
4. Check recommended focus areas

## Troubleshooting

### Backend Issues

**Firebase Connection Error:**

- Verify `GOOGLE_APPLICATION_CREDENTIALS` path is correct
- Ensure `firebase-credentials.json` exists and is valid
- Check `FIREBASE_PROJECT_ID` matches your Firebase project
- Verify Firestore is enabled in Firebase Console

**Firebase Authentication Error:**

- Ensure Email/Password provider is enabled in Firebase Console
- Check that email verification is configured
- Verify Firebase Admin SDK is initialized correctly

**OpenAI API Error:**

- Verify API key is correct
- Check API quota/billing
- Ensure model name is correct (gpt-4 or gpt-3.5-turbo)

### Frontend Issues

**Microphone Not Working:**

- Allow microphone permissions in browser
- Use HTTPS or localhost (required for MediaRecorder)
- Try Chrome/Edge for best compatibility

**API Connection Error:**

- Verify backend is running on port 8000
- Check CORS settings in backend
- Verify API URL in client (default: http://localhost:8000/api/v1)

**Email Verification Not Working:**

- Check Firebase Console > Authentication > Templates
- Verify email verification is enabled
- Check spam folder for verification emails
- Use the resend verification option on login page

## Production Deployment

### Backend

1. Set `DEBUG=False` in `.env`
2. Use production-grade WSGI server (gunicorn)
3. Set up Firebase project for production
4. Configure CORS for production domain
5. Use environment variables for secrets
6. Set up proper email service for verification emails (Firebase handles this)

### Frontend

1. Build production bundle:

```bash
npm run build
```

2. Deploy `dist/` folder to:

- Vercel
- Netlify
- Any static hosting service

3. Update `VITE_API_URL` to production API URL

## Architecture Overview

```
┌─────────────┐
│   Client    │ (React + Vite)
│  Port 5173  │
└──────┬──────┘
       │ HTTP/REST
       ↓
┌─────────────┐
│  API Server │ (FastAPI)
│  Port 8000  │
└──────┬──────┘
       │
       ├─→ Firebase Firestore (Database)
       ├─→ Firebase Auth (Authentication + Email Verification)
       ├─→ OpenAI API (LLM Evaluation)
       └─→ OpenAI Whisper (Speech-to-Text)
```

## Key Features Implemented

✅ Firebase Authentication with email verification
✅ User registration with email verification flow
✅ Login with email verification check
✅ Resend verification email option
✅ Session state machine
✅ Voice recording and transcription
✅ AI-powered evaluation with rubrics
✅ Adaptive difficulty
✅ Progress tracking and analytics
✅ Privacy consent management
✅ Comprehensive feedback system
✅ Firebase Firestore database integration

## Support

For issues or questions:

1. Check API documentation at `/docs`
2. Review error logs in terminal
3. Verify all environment variables are set
4. Ensure all services are running

## License

MIT
