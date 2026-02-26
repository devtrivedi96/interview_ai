# Interview AI - Complete Setup Guide

## Prerequisites

- Python 3.9+
- Node.js 18+
- AWS account with DynamoDB tables and (optional) Cognito user pool
- OpenAI API key

## Backend Setup

### 1. Install Python Dependencies

```bash
cd server
pip install -r requirements.txt
```

### 2. Configure AWS (DynamoDB + Cognito)

1. Create or use an existing AWS account
2. Create DynamoDB tables for `users`, `sessions`, `session_questions`, `evaluations`, and `questions` (or use in-memory fallback for development)
3. (Optional) Create a Cognito User Pool and App Client for hosted authentication
4. Set `AWS_REGION`, `COGNITO_USER_POOL_ID`, and `COGNITO_CLIENT_ID` in your `.env` if using Cognito

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set:

- `OPENAI_API_KEY` - Your OpenAI API key
- `SECRET_KEY` - Generate with `openssl rand -hex 32`
- `AWS_REGION` - AWS region where DynamoDB (and Cognito) are deployed
- `COGNITO_USER_POOL_ID` - (optional) Cognito User Pool ID
- `COGNITO_CLIENT_ID` - (optional) Cognito App Client ID

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

### 2. Configure Environment

```bash
cp .env.example .env
```

The default configuration points to `http://localhost:8000/api/v1`

### 3. Run Development Server

```bash
npm run dev
```

App will be available at: http://localhost:3000

## Testing the Application

### 1. Register a New User

1. Go to http://localhost:3000
2. Click "Get Started" or "Register"
3. Enter email and password
4. Check "audio consent" checkbox
5. Click "Create Account"

### 2. Start an Interview

1. From Dashboard, select interview type (DSA/HR/etc.)
2. Choose difficulty level (1-5)
3. Click "Start Interview"

### 3. Answer Questions

1. Click "Start Recording"
2. Speak your answer clearly
3. Click "Stop Recording"
4. Wait for AI evaluation
5. Review feedback and scores
6. Click "Next Question" or "Complete Session"

### 4. View Analytics

1. Go to Analytics page
2. View score progression
3. See common strengths/improvements
4. Check recommended focus areas

## Troubleshooting

### Backend Issues

**DynamoDB / AWS Connection Error:**

- Verify `AWS_REGION` is set and correct
- Ensure DynamoDB tables exist (users, sessions, session_questions, evaluations, questions)
- If using Cognito, verify `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID`

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
- Verify API URL in `.env`

## Production Deployment

### Backend

1. Set `DEBUG=False` in `.env`
2. Use production-grade WSGI server (gunicorn)
3. Set up proper AWS credentials and resources
4. Configure CORS for production domain
5. Use environment variables for secrets

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
│  Port 3000  │
└──────┬──────┘
       │ HTTP/REST
       ↓
┌─────────────┐
│  API Server │ (FastAPI)
│  Port 8000  │
└──────┬──────┘
       │
       ├─→ DynamoDB (Database)
       ├─→ OpenAI API (LLM Evaluation)
       └─→ OpenAI Whisper (Speech-to-Text)
```

## Key Features Implemented

✅ User authentication with JWT
✅ Session state machine
✅ Voice recording and transcription
✅ AI-powered evaluation with rubrics
✅ Adaptive difficulty
✅ Progress tracking and analytics
✅ Privacy consent management
✅ Comprehensive feedback system

## Support

For issues or questions:

1. Check API documentation at `/docs`
2. Review error logs in terminal
3. Verify all environment variables are set
4. Ensure all services are running

## License

MIT
