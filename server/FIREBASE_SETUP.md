# Firebase Setup Guide

This guide will help you set up Firebase Firestore for the Interview Prep Buddy backend.

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" or "Create a project"
3. Enter project name: `interview-prep-buddy`
4. (Optional) Enable Google Analytics
5. Click "Create project"

## Step 2: Enable Firestore Database

1. In the Firebase Console, click on "Firestore Database" in the left sidebar
2. Click "Create database"
3. Select "Start in production mode" (we'll add security rules later)
4. Choose a Cloud Firestore location (select closest to your users)
5. Click "Enable"

## Step 3: Get Service Account Credentials

1. Click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Go to the "Service accounts" tab
4. Click "Generate new private key"
5. Click "Generate key" in the confirmation dialog
6. Save the downloaded JSON file as `firebase-credentials.json` in your `server/` directory

**Important:** Never commit this file to version control! It's already in `.gitignore`.

## Step 4: Configure Environment Variables

Create a `.env` file in the `server/` directory:

```bash
cp .env.example .env
```

Edit `.env` and set:

```env
FIREBASE_CREDENTIALS_PATH=firebase-credentials.json
SECRET_KEY=your-random-secret-key-here
OPENAI_API_KEY=your-openai-api-key
```

Generate a secure SECRET_KEY:

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Step 5: Install Dependencies

```bash
pip install -r requirements.txt
```

## Step 6: Seed Initial Data

```bash
python seed_questions.py
```

This will create 10 sample questions (5 DSA + 5 HR) in your Firestore database.

## Step 7: Run the Server

```bash
uvicorn main:app --reload
```

Visit http://localhost:8000/docs to see the API documentation.

## Firestore Collections

The application uses these collections:

### users

- Stores user accounts
- Fields: email, hashed_password, created_at

### sessions

- Stores interview sessions
- Fields: user_id, mode, difficulty_start, state, total_score, etc.

### questions

- Question bank for interviews
- Fields: mode, difficulty, question_text, reference_answer

### session_questions

- Questions asked in each session
- Fields: session_id, question_text, difficulty, transcript

### answer_evaluations

- AI evaluations of answers
- Fields: session_question_id, scores, strengths, improvements

## Security Rules (Production)

For production, update your Firestore security rules:

1. Go to Firestore Database in Firebase Console
2. Click on "Rules" tab
3. Replace with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }

    // Authenticated users can manage their sessions
    match /sessions/{sessionId} {
      allow read, write: if request.auth != null &&
        resource.data.user_id == request.auth.uid;
    }

    // Questions are read-only for authenticated users
    match /questions/{questionId} {
      allow read: if request.auth != null;
      allow write: if false; // Only admins via backend
    }

    // Session questions accessible to session owner
    match /session_questions/{questionId} {
      allow read, write: if request.auth != null;
    }

    // Evaluations accessible to session owner
    match /answer_evaluations/{evalId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

4. Click "Publish"

## Indexes (Optional but Recommended)

For better query performance, create these indexes:

1. Go to Firestore Database > Indexes
2. Click "Add index"

**Index 1: sessions by user and date**

- Collection: `sessions`
- Fields: `user_id` (Ascending), `created_at` (Descending)

**Index 2: session_questions by session and date**

- Collection: `session_questions`
- Fields: `session_id` (Ascending), `created_at` (Descending)

**Index 3: questions by mode and difficulty**

- Collection: `questions`
- Fields: `mode` (Ascending), `difficulty` (Ascending)

## Monitoring

Monitor your Firestore usage:

1. Go to Firestore Database > Usage tab
2. Check reads, writes, and storage
3. Free tier includes:
   - 50K reads/day
   - 20K writes/day
   - 1 GB storage

## Troubleshooting

### Error: "Could not load credentials"

- Ensure `firebase-credentials.json` exists in server directory
- Check `FIREBASE_CREDENTIALS_PATH` in `.env`

### Error: "Permission denied"

- Check Firestore security rules
- Ensure user is authenticated

### Error: "Collection not found"

- Run `python seed_questions.py` to create initial data

### Slow queries

- Create indexes as described above
- Check Firestore console for index recommendations

## Local Development with Emulator (Optional)

For local development without using production Firestore:

1. Install Firebase CLI:

```bash
npm install -g firebase-tools
```

2. Initialize emulators:

```bash
firebase init emulators
```

3. Start emulators:

```bash
firebase emulators:start
```

4. Update code to use emulator:

```python
# In db/firebase.py
import os
if os.getenv('USE_EMULATOR'):
    os.environ['FIRESTORE_EMULATOR_HOST'] = 'localhost:8080'
```

## Cost Optimization

- Use batch writes when possible
- Implement caching for frequently accessed data
- Monitor usage in Firebase Console
- Set up budget alerts

## Backup

Enable automatic backups:

1. Go to Firestore Database
2. Click on "Backups" tab
3. Set up automated backup schedule

## Next Steps

- Set up Firebase Authentication (optional)
- Configure Cloud Functions for triggers
- Set up Firebase Hosting for frontend
- Enable Firebase Analytics

**Web SDK config:** A ready-to-use Firebase Web SDK config is included for convenience at `server/static/firebaseConfig.js`. You can copy or import this module into a web frontend (or serve it from your static assets) to initialize Firebase in the browser.
