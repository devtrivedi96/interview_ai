# Interview AI - Voice-First Interview Preparation Platform

AI-powered mock interview platform with voice capture, speech-to-text, and rubric-based evaluation.

## Features

- Voice-first interview practice (DSA, HR, Behavioral, System Design)
- Real-time speech-to-text transcription
- AI-powered rubric-based evaluation
- Adaptive difficulty adjustment
- Comprehensive session analytics
- Privacy-focused with explicit consent management

## Architecture

```
Client (Web) ⇄ API Gateway ⇄ Session Engine ⇄ AI Services (STT, LLM) ⇄ AWS (DynamoDB / Cognito)
```

## Quick Start

### Prerequisites

- Python 3.9+
- AWS account with DynamoDB tables and (optional) Cognito user pool
- OpenAI API key

### Backend Setup

1. Clone and navigate:

```bash
cd server
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Configure environment:

```bash
cp .env.example .env
# Edit .env with your credentials
```

4. Configure AWS resources (DynamoDB + Cognito)

- Create DynamoDB tables (names: `users`, `sessions`, `session_questions`, `evaluations`, `questions`) or use the default in-memory fallback for development.
- If you want hosted authentication, create a Cognito User Pool and App Client and set `COGNITO_USER_POOL_ID` and `COGNITO_CLIENT_ID` in `.env`.

5. Run server:

```bash
cd src
uvicorn main:app --reload --port 8000
```

API available at: http://localhost:8000
Docs available at: http://localhost:8000/docs

## Project Structure

See PROJECT_STRUCTURE.md for detailed layout.

## API Endpoints

### Authentication

- POST /api/v1/auth/register - Register new user (Cognito or local email/password + Brevo verification email)
- POST /api/v1/auth/login - Login (requires verified email)
- POST /api/v1/auth/verify-email/resend - Resend verification email
- GET /api/v1/auth/me - Get current user

### Sessions

- POST /api/v1/sessions - Create session
- POST /api/v1/sessions/{id}/start - Start session
- POST /api/v1/sessions/{id}/questions/next - Get next question
- POST /api/v1/sessions/{id}/questions/{qid}/answer - Submit answer
- GET /api/v1/sessions/{id}/summary - Get summary
- POST /api/v1/sessions/{id}/complete - Complete session

### Analytics

- GET /api/v1/analytics/progress - User progress
- GET /api/v1/analytics/insights - Detailed insights

## Configuration

Key settings in `.env`:

- OPENAI_API_KEY - Required for AI evaluation
- AWS_REGION - AWS region for DynamoDB/Cognito
- COGNITO_USER_POOL_ID - (optional) Cognito User Pool ID for hosted auth
- COGNITO_CLIENT_ID - (optional) Cognito App Client ID
- BREVO_API_KEY - Brevo API key for sending verification email
- BREVO_SENDER_EMAIL - Sender address for verification emails
- EMAIL_VERIFICATION_REDIRECT_URL - Frontend URL after verification

## License

MIT
