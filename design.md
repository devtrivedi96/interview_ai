# Interview Prep Buddy – Detailed Design Document (v2)

## 1. Product Intent

Interview Prep Buddy is an AI-powered mock interview platform for technical (DSA) and HR preparation. The product focuses on three measurable outcomes:
- Better answer quality across repeated mock interviews
- Better speaking clarity and structure
- Better interview confidence from realistic simulation

The platform evaluates reasoning and communication quality, not only final correctness.

---

## 2. Scope and Feature Boundaries

### In Scope (MVP)
- Email/password authentication
- Interview mode selection: DSA, HR
- Voice answer capture + speech-to-text
- AI-led question asking
- Structured scoring per answer
- Adaptive difficulty and follow-up questions
- End-of-session summary
- Session history dashboard

### Out of Scope (MVP)
- Live video interview
- Proctoring / cheating detection
- Real-time coding editor with compiler
- Enterprise SSO

---

## 3. Architecture Overview

The system uses a modular architecture with clean separation of concerns:

1. `client-app` (Web)
2. `api-gateway` (REST API)
3. `interview-engine` (state machine + orchestration)
4. `ai-evaluator` (LLM scoring + feedback)
5. `speech-service` (STT integration)
6. `data-layer` (PostgreSQL + Redis)
7. `observability` (logs, metrics, traces)

### Why this split
- Keeps AI-related logic isolated and testable
- Enables independent scaling of high-latency services (AI/STT)
- Supports adding providers without rewriting core flow

---

## 4. Runtime Flow

### 4.1 Session Start
1. User selects mode and target difficulty
2. `interview-engine` initializes session context
3. First question is generated from question bank + AI personalization

### 4.2 Per-Question Loop
1. User records response (voice)
2. `speech-service` converts audio to text
3. `ai-evaluator` scores answer against rubric + reference solution
4. `interview-engine` decides next action:
   - Easier follow-up
   - Same level reinforcement
   - Harder next question
5. Feedback snippet shown immediately

### 4.3 Session End
- Aggregate scoring and trend analysis
- Generate strengths/improvement/suggestions summary
- Persist session and answer-level analytics

---

## 5. Interview State Machine

States:
- `IDLE`
- `INIT`
- `ASK_QUESTION`
- `CAPTURE_AUDIO`
- `TRANSCRIBE`
- `EVALUATE`
- `DELIVER_FEEDBACK`
- `ADAPT`
- `COMPLETE`
- `FAILED`

Transition guards:
- Retry limits for STT and LLM calls
- Timeout fallback path
- Safety checks for empty/invalid transcript

Failure strategy:
- Fail soft per question (skip with explanation)
- Keep session alive when non-critical errors happen
- Mark degraded quality in analytics

---

## 6. Scoring Framework (Core IP)

Each answer is scored 0-5 in these dimensions.

### DSA Rubric
- Problem understanding
- Approach quality
- Correctness reasoning
- Complexity analysis
- Communication clarity

### HR Rubric
- Relevance to question
- Structure (Situation/Task/Action/Result style)
- Specific evidence/examples
- Self-awareness and reflection
- Communication clarity

### Weighting
- DSA default: 20% each
- HR default: 20% each

### Composite Score
`composite = sum(dimension_score * dimension_weight)`

Adaptive logic uses rolling score over last 2 questions to avoid noisy jumps.

---

## 7. AI Prompting and Guardrails

Prompt inputs:
- Interview mode and difficulty
- Question metadata
- Gold reference answer
- Transcript
- Previous question result

Prompt outputs (strict JSON schema):
- Numeric rubric scores
- `strengths[]`
- `improvements[]`
- `next_question_strategy`
- `confidence`

Guardrails:
- JSON schema validation before persistence
- Reject non-conforming AI responses and retry once
- Neutral and constructive tone constraints
- Avoid penalizing accent/grammar unless comprehension fails

---

## 8. Data Model

### Core Entities
- `users`
- `interview_sessions`
- `questions`
- `session_questions`
- `answer_evaluations`
- `user_progress_snapshots`

### Important Fields
- `interview_sessions`: `mode`, `difficulty_start`, `difficulty_end`, `total_score`, `duration_sec`
- `session_questions`: `question_text`, `difficulty`, `transcript`, `latency_ms`
- `answer_evaluations`: dimension scores, `strengths_json`, `improvements_json`, `confidence`

### Privacy
- Audio blobs not stored permanently in MVP
- Store transcript only (with user consent)
- PII separation from evaluation data

---

## 9. API Contract (v1)

- `POST /auth/register`
- `POST /auth/login`
- `POST /sessions`
- `POST /sessions/{id}/questions/next`
- `POST /sessions/{id}/answers` (audio/transcript payload)
- `GET /sessions/{id}/summary`
- `GET /users/me/progress`

API principles:
- Idempotency keys for answer submission
- Standard error envelope: `code`, `message`, `retryable`
- Request-level tracing IDs

---

## 10. Performance and Reliability Targets

- p95 question generation latency: <= 4s
- p95 answer evaluation latency: <= 6s
- Session completion success rate: >= 98%
- STT error recovery without session drop: >= 95%

---

## 11. Security and Compliance Baseline

- JWT access + rotating refresh tokens
- Password hashing (Argon2id/bcrypt)
- Rate limit on auth and answer endpoints
- Encryption in transit (HTTPS)
- Audit logs for auth + interview submission

---

## 12. Observability

Key metrics:
- `session_start_count`, `session_complete_count`
- `ai_eval_latency_ms`, `stt_latency_ms`
- `eval_retry_count`, `schema_validation_fail_count`
- score improvement trend per user cohort

Dashboards should separate product metrics (learning outcomes) from infra metrics (latency, errors).

---

## 13. Extension Path (Beyond MVP)

- Resume-aware personalized interviews
- Company role templates (SDE-1, PM, Analyst)
- Multi-lingual support
- Real-time interview coach hints
- Team mode for college training cells

This design supports scaling by adding new question providers and evaluation rubrics without changing session orchestration.
