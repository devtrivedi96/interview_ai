# Quick Start Guide - Interview AI Platform

Get up and running in 5 minutes!

## Step 1: Firebase Setup (5 minutes)

### Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project"
3. Enter project name (e.g., "interview-ai")
4. Disable Google Analytics (optional)
5. Click "Create project"

### Enable Firestore
1. In Firebase Console, go to "Firestore Database"
2. Click "Create database"
3. Select "Start in production mode"
4. Choose a location (e.g., us-central)
5. Click "Enable"

### Enable Authentication
1. Go to "Authentication" → "Sign-in method"
2. Click "Email/Password"
3. Enable "Email/Password"
4. Click "Save"

### Get Service Account Key (Backend)
1. Go to "Project Settings" (gear icon)
2. Go to "Service Accounts" tab
3. Click "Generate new private key"
4. Save the JSON file as `server/firebase-credentials.json`

### Get Web App Config (Frontend)
1. In "Project Settings" → "General"
2. Scroll to "Your apps"
3. Click the web icon (</>)
4. Register app with a nickname
5. Copy the `firebaseConfig` object
6. Update `client/src/config/firebase.js` with these values

## Step 2: Backend Setup (2 minutes)

```bash
# Navigate to server directory
cd server

# Install dependencies
pip install -r requirements.txt

# Set environment variable (or add to .env)
export GOOGLE_APPLICATION_CREDENTIALS="firebase-credentials.json"

# Add your OpenAI API key to .env
echo "OPENAI_API_KEY=sk-your-key-here" >> .env

# Start the server
cd src
uvicorn main:app --reload --port 8000
```

Server will be running at: http://localhost:8000
API docs at: http://localhost:8000/docs

## Step 3: Frontend Setup (2 minutes)

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Update Firebase config in src/config/firebase.js
# (Use the config from Step 1)

# Start development server
npm run dev
```

App will be running at: http://localhost:5173

## Step 4: Test the Application (1 minute)

### Register a User
1. Open http://localhost:5173
2. Click "Get Started" or "Register"
3. Enter email and password (min 6 characters)
4. Check the audio consent checkbox
5. Click "Create Account"
6. You'll see a success screen

### Verify Email
1. Check your email inbox
2. Click the verification link from Firebase
3. You'll be redirected to the login page

### Login
1. Enter your email and password
2. Click "Login"
3. You'll be redirected to the dashboard

### Start an Interview
1. From the dashboard, select interview type
2. Choose difficulty level
3. Click "Start Interview"
4. Allow microphone access
5. Click "Start Recording" and answer the question
6. Click "Stop Recording"
7. Wait for AI evaluation
8. Review feedback and continue

## Troubleshooting

### Backend won't start
- Check that `firebase-credentials.json` exists in `server/` directory
- Verify `GOOGLE_APPLICATION_CREDENTIALS` is set correctly
- Make sure Python 3.9+ is installed

### Frontend won't start
- Run `npm install` again
- Check that Node.js 18+ is installed
- Clear npm cache: `npm cache clean --force`

### Email verification not working
- Check Firebase Console → Authentication → Templates
- Verify Email/Password provider is enabled
- Check spam folder for verification email

### Can't login after verification
- Make sure you clicked the verification link in email
- Check Firebase Console → Authentication → Users to see if email is verified
- Try the "Resend verification email" option on login page

### Microphone not working
- Allow microphone permissions in browser
- Use Chrome or Edge for best compatibility
- Make sure you're on localhost or HTTPS

## Environment Variables Quick Reference

### Backend (.env)
```env
FIREBASE_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=firebase-credentials.json
OPENAI_API_KEY=sk-your-openai-key
SECRET_KEY=generate-with-openssl-rand-hex-32
```

### Frontend (src/config/firebase.js)
```javascript
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.firebasestorage.app",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
  measurementId: "your-measurement-id"
}
```

## Next Steps

- Read [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed configuration
- Check [FIREBASE_AUTH_SETUP.md](FIREBASE_AUTH_SETUP.md) for auth details
- Review [CURRENT_STATUS.md](CURRENT_STATUS.md) for feature status
- See [PROJECT_STRUCTURE.md](PROJECT_STRUCTURE.md) for code organization

## Need Help?

- Check the [Troubleshooting](#troubleshooting) section above
- Review the full [SETUP_GUIDE.md](SETUP_GUIDE.md)
- Check Firebase Console for auth/database logs
- Review browser console for frontend errors
- Check terminal for backend errors

## Production Deployment

For production deployment instructions, see [SETUP_GUIDE.md](SETUP_GUIDE.md#production-deployment).

---

That's it! You should now have a fully functional Interview AI platform running locally. 🎉
