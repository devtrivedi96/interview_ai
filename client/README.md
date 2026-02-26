# Interview AI - Frontend

React-based frontend for the Interview AI platform.

## Features

- User authentication (register/login)
- Interview session management
- Voice recording with Web Audio API
- Real-time AI feedback display
- Progress tracking and analytics
- Responsive design with Tailwind CSS

## Tech Stack

- React 18
- Vite (build tool)
- React Router (routing)
- Zustand (state management)
- Axios (API client)
- Recharts (data visualization)
- Tailwind CSS (styling)
- Lucide React (icons)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Configure environment:
```bash
cp .env.example .env
```

3. Run development server:
```bash
npm run dev
```

App will be available at http://localhost:3000

## Build

```bash
npm run build
npm run preview
```

## Project Structure

```
src/
├── components/     # Reusable components
├── pages/          # Page components
├── services/       # API services
├── stores/         # Zustand stores
├── App.jsx         # Main app
└── main.jsx        # Entry point
```

## Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari (limited audio support)

Requires microphone access and MediaRecorder API support.
