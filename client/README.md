# Interview Prep Buddy - Client

Next.js frontend for the Interview Prep Buddy platform.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create environment file:
```bash
cp .env.local.example .env.local
```

3. Update `.env.local` with your API URL:
```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

4. Run development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Features

- User authentication (login/register)
- Interview mode selection (DSA/HR)
- Voice recording for answers
- Real-time AI feedback
- Progress tracking dashboard
- Responsive design

## Pages

- `/` - Home page with interview setup
- `/auth` - Login/Register page
- `/interview` - Interview session page
- `/dashboard` - User progress dashboard

## Tech Stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Axios for API calls

## Project Structure

```
client/
├── app/              # Next.js app router pages
│   ├── auth/         # Authentication page
│   ├── dashboard/    # Progress dashboard
│   ├── interview/    # Interview session
│   ├── layout.tsx    # Root layout
│   ├── page.tsx      # Home page
│   └── globals.css   # Global styles
├── lib/              # Utilities
│   └── api.ts        # API client
├── types/            # TypeScript types
│   └── index.ts      # Shared types
└── public/           # Static assets
```

## API Integration

The client uses axios to communicate with the FastAPI backend. All API calls are centralized in `lib/api.ts`.

### Authentication

Tokens are stored in localStorage and automatically added to requests via axios interceptors.

### Available API Methods

- `authAPI.register(email, password)`
- `authAPI.login(email, password)`
- `sessionAPI.create(data)`
- `sessionAPI.getNextQuestion(sessionId)`
- `sessionAPI.submitAnswer(sessionId, data)`
- `sessionAPI.getSummary(sessionId)`
- `userAPI.getProgress()`

## Development

To fix TypeScript issues, ensure all dependencies are installed:

```bash
rm -rf node_modules package-lock.json
npm install
```

## Build

```bash
npm run build
```

## Deploy

The app can be deployed to Vercel, Netlify, or any platform that supports Next.js.

```bash
npm run build
npm start
```
