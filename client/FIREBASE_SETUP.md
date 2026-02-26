# Firebase Authentication Setup - Client

## Quick Setup

### 1. Install Dependencies

```bash
npm install
```

This will install Firebase SDK (v10.7.2) along with other dependencies.

### 2. Get Firebase Configuration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon → Project Settings
4. Scroll to "Your apps" section
5. Click the web icon (</>) to add a web app
6. Copy the Firebase configuration object

### 3. Configure Environment Variables

Create `.env` file:

```bash
cp .env.example .env
```

Update with your Firebase config:

```env
VITE_API_URL=http://localhost:8000/api/v1

# Firebase Configuration (from Firebase Console)
VITE_FIREBASE_API_KEY=AIzaSyXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:abcdef123456
```

### 4. Enable Email/Password Authentication

1. In Firebase Console, go to **Authentication**
2. Click **Get Started** (if first time)
3. Go to **Sign-in method** tab
4. Click **Email/Password**
5. Enable the first toggle (Email/Password)
6. Click **Save**

### 5. Configure Authorized Domains

1. In Authentication → Settings → Authorized domains
2. Add `localhost` (should be there by default)
3. Add your production domain when deploying

### 6. Run the App

```bash
npm run dev
```

Visit http://localhost:3000

## Features Implemented

### Registration Flow
1. User enters email, password, and audio consent
2. Firebase creates auth user
3. Verification email sent automatically
4. Success screen shows with instructions
5. User must verify email before login

### Login Flow
1. User enters credentials
2. Firebase authenticates
3. Checks if email is verified
4. If not verified → shows error with resend option
5. If verified → logs in and redirects to dashboard

### Email Verification
- Automatic email sent on registration
- Resend option on login page
- Blocks login until verified
- Uses Firebase's built-in email templates

## UI Components

### Register Page
- Email/password form
- Audio consent checkbox
- Success screen after registration
- Email verification instructions
- Link to login page

### Login Page
- Email/password form
- Error handling with specific messages
- Resend verification email button
- Visual feedback for verification status
- Link to register page

## Testing

### Test Registration:
1. Go to http://localhost:3000/register
2. Enter email and password
3. Check "audio consent"
4. Click "Create Account"
5. See success screen
6. Check email for verification link

### Test Login (Before Verification):
1. Try to login with unverified email
2. See error message
3. Click "Resend Verification Email"
4. Check email again

### Test Login (After Verification):
1. Click verification link in email
2. Return to login page
3. Login successfully
4. Redirected to dashboard

## Customization

### Email Templates

Customize in Firebase Console:
1. Authentication → Templates
2. Click "Email address verification"
3. Edit subject and body
4. Use variables: %LINK%, %APP_NAME%, %EMAIL%

### Styling

Update colors in `tailwind.config.js`:
```javascript
colors: {
  primary: {
    // Your brand colors
  }
}
```

## Troubleshooting

### "Firebase not initialized"
- Check `.env` file exists
- Verify all Firebase config variables are set
- Restart dev server after changing `.env`

### "Email already in use"
- Check Firebase Console → Authentication → Users
- Delete test users if needed

### "Email not verified" persists
- Check Firebase Console → Users → Email verified column
- Click verification link again
- Try resending verification email

### Verification email not received
- Check spam folder
- Verify sender email in Firebase Console
- Check email template is enabled

## Production Deployment

### 1. Update Environment Variables

Set production Firebase config in your hosting platform.

### 2. Update Authorized Domains

Add your production domain in Firebase Console.

### 3. Custom Email Domain (Optional)

Configure custom SMTP in Firebase Console for branded emails.

### 4. Security Rules

Ensure Firestore security rules are properly configured.

## Support

- [Firebase Auth Documentation](https://firebase.google.com/docs/auth)
- [Firebase Console](https://console.firebase.google.com/)
- Check browser console for errors
- Verify network requests in DevTools
