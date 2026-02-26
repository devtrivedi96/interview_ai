Interview_ai is a voice-first interview preparation and evaluation platform: users run mock interviews (DSA/HR/role-specific), submit voice answers, receive rubric-based AI feedback, and optionally get resume-aware, RAG-personalized questions. This document states scope, architecture, data model, core modules, MVP features, and rollout decisions for implementers.

## 1. Project Summary

One-line mission: help candidates practice and improve interview performance through automated, rubric-driven mock interviews and actionable feedback. Success criteria: reliable per-question feedback, <5s evaluation latency target for small scale, and consenting storage for sessions.

## 2. Goals & Scope

- MVP goal: end-to-end session loop with voice capture → STT → LLM evaluation → per-question feedback and session summary.
- Out of scope for MVP: live video proctoring, team dashboards, paid plans.

## 3. Non-functional Requirements

- Latency: STT+LLM median <10s for per-question feedback in small pilot.
- Privacy: explicit consent for recording; default retention 30 days for audio/transcripts.
- Security: user-authenticated access, encryption at rest/in transit, basic RBAC.

## 4. Architecture Overview

Client (web) ⇄ API Gateway ⇄ Session Engine (serverless functions) ⇄ AI Services (STT, LLM, embeddings) ⇄ Storage (object store + DB). Keep components decoupled with well-defined REST/JSON contracts and idempotent session endpoints.

## 5. Core Modules

- `auth`: registration, email verification, session tokens.
- `session-engine`: state machine controlling interview flow and difficulty adaptation.
- `speech-service`: client audio capture + quality checks + upload.
- `stt-adapter`: provider wrapper (Whisper/open-hosted) for transcription.
- `ai-evaluator`: LLM prompt templates + JSON-schema validation for rubric outputs.
- `rag-service` (optional MVP): resume ingestion, embedding generation, retrieval.
- `analytics`: metrics, errors, and usage logs.

## 6. Directory & Repo Layout (recommended)

- client/ — web frontend (audio capture UI)
- server/ — API & session engine (serverless functions)
- infra/ — deployment manifests, CI/CD configs
- docs/ — design, privacy, prompt guidelines
- tests/ — unit & integration tests
- embeddings/ — embedding tooling and scripts

## 7. Data Model (summary)

- users/{userId} — profile, verification, consent flags.
- sessions/{sessionId} — mode, state, difficulty, timestamps, summary.
- sessions/{sessionId}/questions/{qId} — questionText, transcript, audioUrl, clarityScore, rubric.
- resume_embeddings/{userId} — vectors + metadata (optional).

## 8. Session State Machine (high level)

IDLE → INIT → PROFILE_CHECK → ASK_QUESTION → VOICE_CAPTURE → QUALITY_CHECK → TRANSCRIBE → EVALUATE → ADAPT → COMPLETE | FAILED. Implement transitions in `session-engine` with idempotent endpoints: `startSession`, `nextQuestion`, `submitAnswer`, `completeSession`.

## 9. Inputs / Outputs & Contracts

- Input: audio blob + metadata (userId, sessionId, questionId).
- STT output: transcript + confidence + tokens (JSON).
- Evaluator output schema (strict JSON): per-dimension scores (0–5), compositeScore, strengths[], improvements[], evalConfidence. Provide JSON Schema and runtime validator before accepting LLM output.

## 10. RAG & Resume Integration (MVP = optional)

- MVP: profile-based simple prompts.
- Phase-2: resume upload → text extraction → embeddings → vector DB retrieval → context sent to LLM for personalized questions.

## 11. Provider Decision Guidance (pick one per item)

- LLM: OpenAI/Anthropic (hosted) or local LLM (cost vs control).
- STT: Whisper API or self-hosted Whisper + GPU.
- Vector DB: Pinecone / Weaviate / Faiss (managed vs self-host).
  Document chosen providers with cost estimation in `docs/requirements.md`.

## 12. Privacy, Consent & Retention

- Require explicit consent for audio storage; allow opt-out (transcripts-only).
- Default retention 30 days; admin override for research with anonymization.
- PII: separate raw audio from profile identifiers; store PII-minimized transcripts for ML.

## 13. Security & Rules

- Enforce `request.auth.uid == resource.data.userId` for session access.
- Sign uploads with short-lived URLs.
- Audit logs for evaluation edits and exports.

## 14. Evaluation & Metrics

Track: per-question clarityScore, eval latency, evalConfidence, compositeScore distribution, session completion rate, retry rate due to poor audio. Define SLOs and alerts for STT/LLM error spikes.

## 15. CI/CD, Testing & Validation

- CI runs linters, unit tests, and JSON-schema validation for evaluator outputs.
- Add an integration test "session loop" that mocks STT and LLM responses and validates evaluator JSON schema.

## 16. MVP Feature List (prioritized)

1. Email/password auth + email verification + profile gating.
2. Web voice capture UI with basic audio quality checks.
3. STT integration and transcript persistence.
4. LLM-based evaluator returning validated rubric JSON.
5. Session engine with per-question loop and adaptive difficulty.
6. Per-question feedback UI and session summary page.
7. Basic analytics (latency, completion).
8. Privacy: consent flag + default 30-day retention.

## 17. Post-MVP / Future Features

- Resume-aware RAG question personalization.
- Multi-lingual support and accent-aware scoring.
- Human-in-the-loop labeling UI and model calibration pipeline.
- Recruiter reports and shareable summaries.
- Advanced voice analytics (fillers, pacing).

## 18. Implementation Next Steps (4-step)

1. Finalize provider choices and document in `docs/requirements.md`.
2. Author `server/api.yaml` and `server/src/schemas/evaluator_schema.json` (strict output schema).
3. Scaffold `client/` audio UI and `server/` session-engine endpoints; add integration test harness in `tests/`.
4. Add CI config to validate evaluator schema and run test harness.

## 19. Decision Checklist (must decide before implementation)

- LLM provider and pricing tier.
- STT provider and whether to keep raw audio.
- Vector DB choice if RAG planned.
- Retention period and legal compliance obligations.
