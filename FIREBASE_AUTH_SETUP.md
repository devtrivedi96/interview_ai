# Firebase Authentication Setup Guide

This guide explains how to set up Firebase Authentication with email verification for the Interview AI platform.

## Backend Setup (Already Implemented)

The backend now supports Firebase Authentication with:
- User registration with Firebase Auth
- Email verification link generation
- Token verification
- Firestore user profile storage

### Files Created:
- `server/src/auth/firebase_auth.py` - Firebase Auth helper functions
- `server/src/auth/routes_firebase.py` - Auth routes with Firebase
- Updated `server/src/auth/security.py` - Added Firebase token verification

## Firebase Console Setup

### 1. Enable Email/Password Authentication

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** → **Sign-in method**
4. Enable **Email/Password** provider
5. Click **Save**

### 2. Configure Email Templates (Optional)

1. In Authentication settings, go to **Templates**
2. Customize the **Email address verification** template
3. Set your app name and sender information

### 3. Get Firebase Config for Client

1. Go to **Project Settings** → **General**
2. Scroll to **Your apps** section
3. Click **Web app** icon (</>) to add a web app
4. Copy the Firebase configuration object

## Client Setup (React)

### 1. Install Firebase SDK

```bash
cd client
npm install firebase
```

### 2. Create Firebase Config

Create `client/src/config/firebase.js`:

```javascript
import { initializeApp } from 'firebase/app'
import { getAuth } from 'firebase/auth'

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
}

const app = initializeApp(firebaseConfig)
export const auth = getAuth(app)
```

### 3. Update Auth Store

Update `client/src/stores/authStore.js`:

```javascript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  signOut
} from 'firebase/auth'
import { auth } from '../config/firebase'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      register: async (email, password, audioConsent = false) => {
        // Create user with Firebase
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        
        // Send verification email
        await sendEmailVerification(userCredential.user)
        
        // Register with backend
        await api.post('/auth/register', {
          email,
          password,
          audio_consent: audioConsent
        })
        
        return {
          message: 'Registration successful! Please check your email to verify your account.'
        }
      },

      login: async (email, password) => {
        // Sign in with Firebase
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        
        // Check if email is verified
        if (!userCredential.user.emailVerified) {
          throw new Error('Please verify your email before logging in.')
        }
        
        // Get ID token
        const idToken = await userCredential.user.getIdToken()
        
        // Login with backend
        const response = await api.post('/auth/login', { id_token: idToken })
        
        set({ 
          token: idToken,
          user: response.data.user,
          isAuthenticated: true 
        })
        
        return response.data
      },

      logout: async () => {
        await signOut(auth)
        set({ user: null, token: null, isAuthenticated: false })
      },

      refreshToken: async () => {
        const currentUser = auth.currentUser
        if (currentUser) {
          const idToken = await currentUser.getIdToken(true)
          set({ token: idToken })
          return idToken
        }
        return null
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
```

### 4. Update API Client

Update `client/src/services/api.js` to refresh Firebase tokens:

```javascript
import axios from 'axios'
import { useAuthStore } from '../stores/authStore'
import { auth } from '../config/firebase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const currentUser = auth.currentUser
    if (currentUser) {
      const token = await currentUser.getIdToken()
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

## Testing the Flow

### 1. Register a New User

```bash
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "password123",
  "audio_consent": true
}
```

Response includes verification link (in production, sent via email).

### 2. Verify Email

User clicks the verification link from email, which redirects to Firebase's verification page.

### 3. Login

Client uses Firebase SDK:
```javascript
const userCredential = await signInWithEmailAndPassword(auth, email, password)
const idToken = await userCredential.user.getIdToken()
```

Then sends ID token to backend:
```bash
POST /api/v1/auth/login
{
  "id_token": "eyJhbGciOiJSUzI1NiIsImtpZCI6..."
}
```

### 4. Access Protected Routes

All subsequent API calls include the Firebase ID token in the Authorization header.

## Email Verification Flow

```
1. User registers → Firebase creates user (email_verified: false)
2. Backend generates verification link
3. Link sent to user's email (via email service in production)
4. User clicks link → Firebase verifies email
5. User logs in → Backend checks email_verified status
6. If verified → Login successful
7. If not verified → Login blocked with message
```

## Production Considerations

### Email Service Integration

In production, integrate an email service to send verification emails:

**Option 1: SendGrid**
```python
import sendgrid
from sendgrid.helpers.mail import Mail

def send_verification_email(email, verification_link):
    message = Mail(
        from_email='noreply@yourapp.com',
        to_emails=email,
        subject='Verify your email',
        html_content=f'<a href="{verification_link}">Verify Email</a>'
    )
    sg = sendgrid.SendGridAPIClient(api_key=settings.SENDGRID_API_KEY)
    sg.send(message)
```

**Option 2: AWS SES**
```python
import boto3

def send_verification_email(email, verification_link):
    ses = boto3.client('ses', region_name='us-east-1')
    ses.send_email(
        Source='noreply@yourapp.com',
        Destination={'ToAddresses': [email]},
        Message={
            'Subject': {'Data': 'Verify your email'},
            'Body': {'Html': {'Data': f'<a href="{verification_link}">Verify Email</a>'}}
        }
    )
```

### Security Best Practices

1. **Use HTTPS** - Always use HTTPS in production
2. **Secure Firebase Rules** - Set up Firestore security rules
3. **Token Expiration** - Firebase tokens expire after 1 hour
4. **Rate Limiting** - Implement rate limiting on auth endpoints
5. **CORS Configuration** - Restrict CORS to your domain

### Firebase Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null && 
        resource.data.user_id == request.auth.uid;
    }
  }
}
```

## Troubleshooting

### Email Not Verified Error
- Check Firebase Console → Authentication → Users
- Verify email_verified status
- Resend verification email if needed

### Token Expired
- Firebase tokens expire after 1 hour
- Client should refresh token automatically
- Use `getIdToken(true)` to force refresh

### CORS Errors
- Add your domain to Firebase authorized domains
- Update backend CORS settings

## Migration from JWT to Firebase Auth

If migrating from existing JWT auth:

1. Keep both auth systems temporarily
2. Add Firebase Auth routes alongside existing routes
3. Migrate users gradually
4. Update client to use Firebase SDK
5. Remove old JWT auth once migration complete

## Support

For Firebase Auth issues:
- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firebase Console](https://console.firebase.google.com/)
- Check Firebase Auth logs in console
