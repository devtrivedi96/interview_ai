# 🚀 Quick Start Guide - Interview AI

This guide will get your Interview AI application up and running with Firebase authentication.

## 📋 Prerequisites

- Python 3.8+ installed
- Node.js 16+ and npm installed
- Firebase project created (Project ID: `interview-33adc`)
- Firebase service account credentials

## 🔥 Step 1: Firebase Setup

### Get Your Firebase Credentials

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project `interview-33adc`
3. Click ⚙️ (Settings) → Project settings → Service accounts
4. Click "Generate new private key"
5. Download the JSON file
6. Rename it to `firebase-credentials.json`
7. Move it to the `server/` directory

### Enable Authentication

1. In Firebase Console, go to Authentication
2. Click "Sign-in method" tab
3. Enable "Email/Password" provider
4. Save

## 🖥️ Step 2: Server Setup

```bash
# Navigate to server directory
cd server

# Create virtual environment
python -m venv .venv

# Activate virtual environment
# On Linux/Mac:
source .venv/bin/activate
# On Windows:
# .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Verify .env file exists and has correct values
cat .env

# Start the server
python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
```

The server should start at `http://localhost:8000`

## 💻 Step 3: Client Setup

Open a new terminal:

```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Verify .env file exists
cat .env

# Start the development server
npm run dev
```

The client should start at `http://localhost:5173`

## ✅ Step 4: Test the Application

1. Open your browser to `http://localhost:5173`
2. Click "Sign up" or "Register"
3. Enter an email and password (min 6 characters)
4. Check the server logs for the verification link
5. Click the verification link to verify your email
6. Return to the app and log in

## 🔍 Troubleshooting

### Server won't start

**Error: "Failed to initialize Firebase"**
- Check that `server/firebase-credentials.json` exists
- Verify the JSON file is valid
- Ensure the service account has correct permissions

**Error: "FIREBASE_API_KEY not configured"**
- Check `server/.env` file exists
- Verify `FIREBASE_API_KEY` is set

### Client won't start

**Error: "Cannot find module"**
```bash
cd client
rm -rf node_modules package-lock.json
npm install
```

### Authentication not working

**Registration fails**
- Check server logs for detailed error
- Verify Firebase Email/Password provider is enabled
- Check that credentials file is in the correct location

**Email verification not received**
- Email delivery is not configured yet (development mode)
- Check server logs for the verification link
- Copy the link from logs and paste in browser

**Login fails with "Email not verified"**
- Click the verification link from server logs
- Or use the "Resend verification email" option

### CORS errors

- Verify server is running on port 8000
- Verify client is running on port 5173
- Check `server/.env` has correct CORS_ORIGINS

## 📚 Next Steps

- Read [FIREBASE_CREDENTIALS_SETUP.md](./FIREBASE_CREDENTIALS_SETUP.md) for detailed Firebase setup
- Check [SETUP_GUIDE.md](./SETUP_GUIDE.md) for additional configuration
- Review [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) to understand the codebase

## 🆘 Still Having Issues?

1. Check server logs: Look at the terminal where you ran `uvicorn`
2. Check browser console: Press F12 in your browser
3. Verify all environment variables are set correctly
4. Ensure both server and client are running
5. Try restarting both server and client

## 🔐 Security Notes

- Never commit `firebase-credentials.json` to git
- Keep your API keys secure
- Use environment variables for sensitive data
- The `.gitignore` file already excludes credentials

## 📝 Environment Files

### server/.env
```env
FIREBASE_API_KEY=AIzaSyAxtOG-bjMgBpBXCH0IxYqKCQd5orOach0
FIREBASE_PROJECT_ID=interview-33adc
# ... other Firebase config
```

### client/.env
```env
VITE_API_URL=http://localhost:8000/api/v1
VITE_FIREBASE_API_KEY=AIzaSyAxtOG-bjMgBpBXCH0IxYqKCQd5orOach0
# ... other Firebase config
```

Both files should already exist with the correct values.
