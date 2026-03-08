---
inclusion: manual
---

# Troubleshooting Guide

Common issues and their solutions for the Interview AI project.

## Firebase Issues

### "Failed to initialize Firebase"

**Symptoms**: Server fails to start with Firebase initialization error

**Solutions**:
1. Check that `server/firebase-credentials.json` exists
2. Verify the JSON file is valid (not corrupted)
3. Ensure the service account has correct permissions
4. Check file path in environment variable `FIREBASE_CREDENTIALS_PATH`

**Verification**:
```bash
cd server
ls -la firebase-credentials.json
python -c "import json; json.load(open('firebase-credentials.json'))"
```

### "Email not verified"

**Symptoms**: Login fails with "Email not verified" error

**Solutions**:
1. Check server logs for verification link
2. Click the verification link from logs
3. Use "Resend verification email" option
4. Verify Email/Password provider is enabled in Firebase Console

**Manual verification** (development only):
```python
# In Firebase Console > Authentication > Users
# Click on user and manually verify email
```

### "Invalid token" or "Token expired"

**Symptoms**: API calls fail with 401 Unauthorized

**Solutions**:
1. User needs to log in again
2. Check token is being sent in Authorization header
3. Verify token format: `Bearer <token>`
4. Check server time is synchronized

**Debug**:
```javascript
// In browser console
console.log(localStorage.getItem('auth-storage'))
```

## Server Issues

### Server won't start

**Symptoms**: `uvicorn` command fails

**Solutions**:
1. Check virtual environment is activated
2. Verify all dependencies are installed
3. Check for port conflicts (8000)
4. Review error messages in terminal

**Commands**:
```bash
cd server
source .venv/bin/activate
pip install -r requirements.txt
lsof -i :8000  # Check if port is in use
```

### Import errors

**Symptoms**: `ModuleNotFoundError` or import errors

**Solutions**:
1. Ensure you're in the server directory
2. Virtual environment is activated
3. Dependencies are installed
4. Python path is correct

**Fix**:
```bash
cd server
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn src.main:app --reload
```

### Database connection errors

**Symptoms**: Firestore operations fail

**Solutions**:
1. Check Firebase credentials are valid
2. Verify internet connection
3. Check Firestore is enabled in Firebase Console
4. Review Firestore security rules

## Client Issues

### Client won't start

**Symptoms**: `npm run dev` fails

**Solutions**:
1. Delete `node_modules` and reinstall
2. Clear npm cache
3. Check Node.js version (16+)
4. Verify port 5173 is available

**Commands**:
```bash
cd client
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
npm run dev
```

### CORS errors

**Symptoms**: API calls fail with CORS error in browser console

**Solutions**:
1. Verify server is running on port 8000
2. Check `CORS_ORIGINS` in `server/.env`
3. Ensure client URL is in CORS origins
4. Restart server after changing CORS settings

**Check**:
```bash
# In server/.env
CORS_ORIGINS=["http://localhost:3000","http://localhost:5173"]
```

### Environment variables not loading

**Symptoms**: `undefined` values for env variables

**Solutions**:
1. Check `.env` file exists in client directory
2. Verify variables start with `VITE_`
3. Restart dev server after changing .env
4. Check for typos in variable names

**Verify**:
```bash
cd client
cat .env
# Restart dev server
npm run dev
```

## Authentication Issues

### Registration fails

**Symptoms**: User registration returns error

**Common causes**:
1. Email already exists
2. Password too short (min 6 characters)
3. Firebase Auth not enabled
4. Network issues

**Debug**:
```bash
# Check server logs
# Look for detailed error messages
```

### Login fails

**Symptoms**: Login returns error or doesn't work

**Solutions**:
1. Verify email is verified
2. Check password is correct
3. Ensure user exists in Firebase Auth
4. Check server logs for details

**Manual check**:
- Go to Firebase Console > Authentication > Users
- Verify user exists and email is verified

### Token not persisting

**Symptoms**: User logged out on page refresh

**Solutions**:
1. Check Zustand persist is configured
2. Verify localStorage is working
3. Check browser privacy settings
4. Clear browser cache and try again

**Debug**:
```javascript
// In browser console
localStorage.getItem('auth-storage')
```

## API Issues

### 404 Not Found

**Symptoms**: API endpoint returns 404

**Solutions**:
1. Verify endpoint URL is correct
2. Check API prefix `/api/v1`
3. Ensure router is registered in main.py
4. Check server is running

**Verify**:
```bash
curl http://localhost:8000/api/v1/auth/me
```

### 500 Internal Server Error

**Symptoms**: API returns 500 error

**Solutions**:
1. Check server logs for stack trace
2. Verify database operations are correct
3. Check for unhandled exceptions
4. Review recent code changes

**Debug**:
- Look at server terminal for detailed error
- Check FastAPI docs: http://localhost:8000/docs

### Request validation errors

**Symptoms**: 422 Unprocessable Entity

**Solutions**:
1. Check request payload matches Pydantic model
2. Verify required fields are included
3. Check data types are correct
4. Review validation rules

**Example**:
```javascript
// Correct payload
{
  "email": "user@example.com",
  "password": "password123",
  "audio_consent": false
}
```

## Performance Issues

### Slow API responses

**Symptoms**: API calls take too long

**Solutions**:
1. Check database queries are optimized
2. Add indexes for frequently queried fields
3. Minimize Firestore reads
4. Use caching where appropriate

**Profile**:
```python
import time
start = time.time()
# Your code
print(f"Took {time.time() - start}s")
```

### High memory usage

**Symptoms**: Application uses too much memory

**Solutions**:
1. Check for memory leaks
2. Limit query result sizes
3. Use pagination for large datasets
4. Profile memory usage

## Development Workflow Issues

### Changes not reflecting

**Symptoms**: Code changes don't appear

**Solutions**:
1. Check hot reload is working
2. Clear browser cache
3. Restart dev server
4. Check for syntax errors

**For server**:
```bash
# Restart with --reload flag
python -m uvicorn src.main:app --reload
```

**For client**:
```bash
# Hard refresh: Ctrl+Shift+R (or Cmd+Shift+R on Mac)
```

### Git conflicts

**Symptoms**: Merge conflicts in git

**Solutions**:
1. Pull latest changes before starting work
2. Commit frequently
3. Use feature branches
4. Resolve conflicts carefully

**Commands**:
```bash
git pull origin main
git checkout -b feature/my-feature
# Make changes
git add .
git commit -m "feat: add feature"
git push origin feature/my-feature
```

## Getting More Help

If issues persist:

1. **Check logs**: Server terminal and browser console
2. **Review documentation**: README.md, SETUP_GUIDE.md
3. **Test in isolation**: Minimal reproduction
4. **Ask Kiro**: Describe the issue in detail
5. **Check Firebase Console**: For auth/database issues

## Useful Commands

```bash
# Server
cd server
source .venv/bin/activate
python -m uvicorn src.main:app --reload --log-level debug

# Client
cd client
npm run dev

# Check ports
lsof -i :8000  # Server
lsof -i :5173  # Client

# View logs
tail -f server/logs/app.log

# Test API
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```
