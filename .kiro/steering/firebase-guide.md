---
inclusion: fileMatch
fileMatchPattern: "**/firebase*.{py,js,jsx,ts,tsx}"
---

# Firebase Integration Guide

## Overview

This project uses Firebase for:
- **Authentication**: Email/password authentication with email verification
- **Database**: Firestore for storing user data, sessions, and evaluations
- **Storage**: (Future) For storing audio recordings

## Firebase Configuration

### Project Details
- **Project ID**: `interview-33adc`
- **Region**: Default (us-central)
- **Authentication**: Email/Password enabled

### Required Files

1. **Backend Credentials**: `server/firebase-credentials.json`
   - Service account key from Firebase Console
   - Never commit to git (already in .gitignore)

2. **Environment Variables**:
   - `server/.env`: Backend Firebase config
   - `client/.env`: Frontend Firebase config

## Authentication Flow

### Registration Flow
1. User submits email/password on frontend
2. Frontend sends credentials to backend `/api/v1/auth/register`
3. Backend creates Firebase Auth user with `email_verified=False`
4. Backend creates Firestore user document
5. Firebase automatically sends verification email
6. User clicks verification link in email
7. User can now log in

### Login Flow
1. User submits email/password on frontend
2. Frontend sends credentials to backend `/api/v1/auth/login`
3. Backend authenticates via Firebase REST API
4. Backend verifies email is verified
5. Backend returns ID token
6. Frontend stores token and uses for subsequent requests

### Token Verification
1. Frontend includes token in Authorization header
2. Backend verifies token using Firebase Admin SDK
3. Backend extracts user ID from token
4. Backend fetches user data from Firestore

## Firestore Collections

### Users Collection (`users`)
```javascript
{
  id: "firebase_uid",
  email: "user@example.com",
  email_verified: true,
  audio_consent: false,
  created_at: Timestamp,
  last_login: Timestamp,
  profile: {
    name: "Optional",
    experience_level: "Optional",
    target_roles: []
  }
}
```

### Sessions Collection (`sessions`)
```javascript
{
  id: "session_id",
  user_id: "firebase_uid",
  status: "active|completed|abandoned",
  difficulty: "easy|medium|hard",
  focus_area: "algorithms|system_design|behavioral",
  started_at: Timestamp,
  completed_at: Timestamp,
  duration_minutes: 30,
  questions_count: 5
}
```

### Session Questions Collection (`session_questions`)
```javascript
{
  id: "question_id",
  session_id: "session_id",
  question_text: "Question content",
  user_answer: "User's answer",
  audio_url: "Optional audio URL",
  transcript: "Transcribed answer",
  evaluation: {
    score: 85,
    feedback: "Detailed feedback",
    strengths: [],
    improvements: []
  },
  answered_at: Timestamp
}
```

### Evaluations Collection (`evaluations`)
```javascript
{
  id: "evaluation_id",
  session_id: "session_id",
  question_id: "question_id",
  overall_score: 85,
  criteria_scores: {
    correctness: 90,
    clarity: 80,
    completeness: 85
  },
  feedback: "Detailed feedback",
  created_at: Timestamp
}
```

## Backend Firebase Usage

### Initializing Firebase
```python
from src.auth import firebase_auth

# Initialize once at app startup
firebase_auth.initialize_firebase()
```

### Creating Users
```python
from src.auth import firebase_auth

try:
    user = firebase_auth.create_user(
        email="user@example.com",
        password="password123",
        email_verified=False
    )
    # Returns: {"uid": "...", "email": "...", "email_verified": False}
except firebase_auth.EmailAlreadyExistsError:
    # Handle duplicate email
    pass
```

### Verifying Tokens
```python
from src.auth import firebase_auth

try:
    decoded_token = firebase_auth.verify_id_token(id_token)
    user_id = decoded_token["uid"]
    email = decoded_token["email"]
    email_verified = decoded_token["email_verified"]
except firebase_auth.InvalidTokenError:
    # Handle invalid token
    pass
```

### Firestore Operations
```python
from src.db.firebase_client import get_db, Collections

db = get_db()

# Create document
user_ref = db.collection(Collections.USERS).document(user_id)
user_ref.set({
    "email": "user@example.com",
    "created_at": datetime.utcnow()
})

# Read document
user_doc = user_ref.get()
if user_doc.exists:
    user_data = user_doc.to_dict()

# Update document
user_ref.update({
    "last_login": datetime.utcnow()
})

# Query collection
users = db.collection(Collections.USERS).where("email_verified", "==", True).get()
for user in users:
    print(user.to_dict())
```

### Protected Routes
```python
from fastapi import Depends
from src.auth.security import get_current_user_firebase
from src.db.models import User

@router.get("/protected")
async def protected_route(current_user: User = Depends(get_current_user_firebase)):
    # current_user is automatically populated from token
    return {"user_id": current_user.id, "email": current_user.email}
```

## Frontend Firebase Usage

### Firebase Config
```javascript
// client/src/config/firebase.js
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  // ... other config
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
```

### Authentication in Frontend
```javascript
// The frontend sends credentials to backend, not directly to Firebase
// Backend handles Firebase authentication

import api from '../services/api'

// Register
const register = async (email, password) => {
  const response = await api.post('/auth/register', {
    email,
    password,
    audio_consent: false
  })
  return response.data
}

// Login
const login = async (email, password) => {
  const response = await api.post('/auth/login', {
    email,
    password
  })
  const token = response.data.access_token
  // Store token and use for subsequent requests
  return token
}
```

### Using Tokens
```javascript
// client/src/services/api.js
import axios from 'axios'
import { useAuthStore } from '../stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL
})

// Add token to all requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})
```

## Common Issues and Solutions

### Issue: "Failed to initialize Firebase"
**Solution**: Ensure `server/firebase-credentials.json` exists and is valid

### Issue: "Email not verified"
**Solution**: User must click verification link in email before logging in

### Issue: "Invalid token"
**Solution**: Token may be expired, user needs to log in again

### Issue: "CORS error"
**Solution**: Check CORS_ORIGINS in `server/.env` includes client URL

### Issue: "Permission denied" in Firestore
**Solution**: Check Firestore security rules allow the operation

## Security Rules

### Firestore Rules (to be configured in Firebase Console)
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Sessions belong to users
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
    
    // Questions belong to sessions
    match /session_questions/{questionId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## Best Practices

1. **Always verify tokens on backend**: Never trust client-side authentication
2. **Use Firestore transactions**: For operations that need atomicity
3. **Minimize reads**: Firestore charges per read operation
4. **Index queries**: Add indexes for complex queries
5. **Handle offline**: Firestore has offline persistence
6. **Batch operations**: Use batch writes for multiple updates
7. **Error handling**: Always handle Firebase errors gracefully
8. **Rate limiting**: Implement to prevent abuse
9. **Monitor usage**: Check Firebase Console for usage metrics
10. **Backup data**: Set up automated backups in production

## Testing with Firebase

### Backend Testing
```python
# Use Firebase emulator for testing
import os
os.environ["FIRESTORE_EMULATOR_HOST"] = "localhost:8080"

# Or mock Firebase calls
from unittest.mock import patch

@patch('src.auth.firebase_auth.verify_id_token')
def test_protected_route(mock_verify):
    mock_verify.return_value = {"uid": "test_user"}
    # Test logic
```

### Frontend Testing
```javascript
// Mock API calls, not Firebase directly
import { vi } from 'vitest'
import api from '../services/api'

vi.mock('../services/api')
api.post.mockResolvedValue({ data: { access_token: 'test_token' } })
```

## Production Considerations

1. **Use Firebase App Check**: Prevent unauthorized access
2. **Enable reCAPTCHA**: For authentication endpoints
3. **Set up monitoring**: Use Firebase Performance Monitoring
4. **Configure email templates**: Customize verification emails
5. **Set up custom domain**: For email action handlers
6. **Implement rate limiting**: Prevent abuse
7. **Regular security audits**: Review Firestore rules
8. **Backup strategy**: Automated daily backups
9. **Cost monitoring**: Set up billing alerts
10. **Multi-region**: Consider for high availability
