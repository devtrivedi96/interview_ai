# Backend Documentation

## Overview

The backend is a FastAPI service that manages authentication, profile/preferences, interview session orchestration, AI-based question/evaluation generation, speech-to-text processing, and analytics endpoints.

## Tech Stack

- FastAPI (modular routers)
- Pydantic models and schema validation
- DynamoDB abstraction layer (`aws_client`) with in-memory fallback patterns
- AWS Bedrock and fallback providers for content/evaluation generation
- STT adapter for audio transcription

## Backend Modules

- `src/main.py`: app bootstrap, middleware, router registration
- `src/auth/*`: auth and consent routes/security
- `src/profile/routes.py`: preferences, preparation, suggested interview
- `src/session_engine/*`: session lifecycle, adaptive question flow, state transitions
- `src/ai_evaluator/*`: rubric prompts, scoring, structured feedback
- `src/stt_adapter/service.py`: audio transcription pipeline
- `src/analytics/routes.py`: progress/insights/leaderboard

## Core API Domains

- `POST /api/v1/sessions` create interview session
- `POST /api/v1/sessions/{session_id}/start` start session + first question
- `POST /api/v1/sessions/{session_id}/questions/next` generate next adaptive question
- `POST /api/v1/sessions/{session_id}/questions/{question_id}/answer` submit answer (text/audio)
- `POST /api/v1/sessions/{session_id}/complete` complete and summarize session
- `GET /api/v1/sessions/{session_id}/summary` fetch final summary
- `GET /api/v1/analytics/progress` and `/insights`

## Interview Engine Pipeline (Backend)

1. Create session with mode + starting difficulty.
2. Start session and transition state from `INIT` to `ASK_QUESTION`.
3. Generate first question (Bedrock/content generator fallback).
4. Accept answer input (text or transcribed audio).
5. Evaluate answer using rubric-based AI evaluator.
6. Update adaptive difficulty and produce next question.
7. Complete session and generate summary/action plan.

## Workflow Diagram

High-level system workflow used by backend and frontend together:

![System Workflow](assets/System_workflow.png)

## Backend in Product Screens

The following screens are powered by backend session/evaluation/analytics APIs:

![Interview](assets/Interview.png)

![Evaluation](assets/Evaluation.png)

![Interview Strengths](assets/Strength_of%20_giveninterview.png)

![Analytics](assets/Analytics.png)

## Backend Runtime Flow (Request Path)

1. Client sends authenticated request.
2. Auth/security dependency resolves current user.
3. Route handler validates request payload and session ownership.
4. Service layer invokes interview engine / AI evaluator / STT adapter.
5. Data layer reads/writes session, questions, and evaluations.
6. Structured response returned to client for next UI state.

## Local Run

```bash
cd server
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```
