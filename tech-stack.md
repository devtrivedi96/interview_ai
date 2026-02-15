# Interview Prep Buddy – Recommended Tech Stack

## Primary Stack (Fast + Scalable)

### Frontend
- Next.js (React + App Router)
- Tailwind CSS for rapid UI
- Web Audio API / MediaRecorder for voice capture

Why:
- Fast iteration and easy deploy
- Good ecosystem for auth and dashboards

### Backend
- FastAPI (Python) or NestJS (TypeScript)
- REST-first API contracts
- Background jobs for AI evaluation retries

Why:
- FastAPI: quick API + pydantic schema checks
- NestJS: structured modular architecture for larger teams

### Data Layer
- PostgreSQL (primary)
- Redis (cache, short-lived session state, rate limit counters)

### AI + Speech
- LLM provider with structured JSON output support
- STT provider with streaming or near-real-time transcription

### Observability
- OpenTelemetry instrumentation
- Grafana/Prometheus or hosted equivalent
- Sentry for client/server errors

---

## Suggested Folder Structure

```text
client/
server/
docs/
  design.md
  requirements.md
  roadmap.md
```

---

## API and Schema Strategy

- Use OpenAPI as source of truth
- Enforce response schemas at runtime
- Version external APIs as `/api/v1`

---

## Deployment Plan

- Frontend: Vercel/Netlify
- Backend: Render/Fly.io/Railway
- DB: Managed Postgres (free tier initially)

---

## Non-Negotiable Engineering Standards

- Strict typing (TypeScript or pydantic models)
- Centralized error handling
- Retry with exponential backoff for LLM/STT
- Basic integration tests for interview loop

---

## Scaling Path

- Start monolith + modules
- Split out `ai-evaluator` service once traffic/latency grows
- Add queue workers for async evaluation at higher volume
