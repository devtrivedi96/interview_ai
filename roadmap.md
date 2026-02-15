# Interview Prep Buddy – Roadmap

## Phase 0 (Days 1-2): Foundations
- Setup repo structure: `client/`, `server/`, `docs/`
- Define DB schema and migration baseline
- Add auth endpoints and basic UI shell

Exit Criteria:
- User can register/login and start empty session

## Phase 1 (Days 3-5): Core Interview Loop (MVP)
- Session state machine implementation
- Question delivery API
- Voice capture + STT integration
- LLM evaluation with rubric JSON output
- Immediate feedback card after each answer

Exit Criteria:
- Full mock interview runs end-to-end with 5 questions

## Phase 2 (Days 6-7): Adaptive Intelligence + Summary
- Difficulty adaptation policy
- Session summary with trend chart
- Persist answer-level analytics

Exit Criteria:
- User sees adaptive path and final improvement plan

## Phase 3 (Week 2): Product Hardening
- Retries/timeouts/circuit breaker for AI providers
- Observability dashboards
- Rate limits and auth hardening
- Basic test suite (API + critical flow)

Exit Criteria:
- Stable demo with measurable latency and error metrics

## Phase 4 (Weeks 3-4): Growth Features
- Resume-aware personalization
- Company/role-specific interview packs
- Team dashboard for colleges/cohorts

Exit Criteria:
- Differentiated, market-ready v1

---

## Priority Backlog (Top 10)
1. End-to-end interview session API
2. Rubric evaluator prompt + schema validator
3. Adaptive difficulty algorithm
4. Per-question feedback UI
5. Session summary generator
6. Progress dashboard
7. Retry and fallback policy for AI/STT
8. Authentication hardening
9. Basic automated test coverage
10. Instrumentation and metrics dashboard

---

## Team Split Suggestion

### Engineer 1 (Backend + Data)
- Session engine, APIs, DB models, adaptation service

### Engineer 2 (AI + Prompting)
- Evaluator prompts, schema validation, feedback quality

### Engineer 3 (Frontend)
- Interview UI, voice UX, summary and progress screens

### Engineer 4 (Platform/QA, optional)
- CI, telemetry, testing, deployment
