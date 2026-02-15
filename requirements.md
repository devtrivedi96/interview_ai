# Interview Prep Buddy – Requirements Specification (v2)

## 1. Product Goals

- Improve candidate interview readiness with measurable progress
- Provide realistic interview simulation through voice-first interaction
- Deliver actionable, rubric-based feedback after each answer

## 2. Personas

- Student preparing for internship interviews
- Early-career engineer preparing for DSA rounds
- Job seeker preparing for HR/behavioral interviews

## 3. Functional Requirements

### FR-1 Authentication and Profile
- Users can register/login securely
- Users can view profile and interview history

Acceptance Criteria:
- Login success and failure paths are handled
- Session persists across refresh with valid token

### FR-2 Interview Configuration
- User selects mode (`DSA`/`HR`), duration, and difficulty

Acceptance Criteria:
- Selected config is stored in session metadata

### FR-3 Question Delivery
- System generates or selects context-appropriate questions
- Follow-up question should depend on prior answer quality

Acceptance Criteria:
- At least one adaptive transition occurs in a 20-minute session

### FR-4 Voice Answer Capture
- User records answer through browser mic
- Client uploads audio stream/file safely

Acceptance Criteria:
- Browser permission denial is gracefully handled

### FR-5 Speech-to-Text
- Audio is transcribed with punctuation and sentence boundaries

Acceptance Criteria:
- Transcription failure returns retry path without ending session

### FR-6 AI Evaluation and Scoring
- System evaluates answer with rubric dimensions
- DSA includes correctness and complexity reasoning
- HR includes structure and evidence quality

Acceptance Criteria:
- Evaluation response includes per-dimension scores and rationale

### FR-7 Structured Feedback
- Feedback includes strengths, improvements, and next-step drills

Acceptance Criteria:
- Every evaluated answer returns all 3 sections

### FR-8 Adaptive Flow
- Difficulty adjusts up/down based on rolling performance

Acceptance Criteria:
- Adaptive decision is logged with reason code

### FR-9 Session Summary
- End summary includes score trends, weak dimensions, and action plan

Acceptance Criteria:
- Summary generated for >= 98% completed sessions

### FR-10 Progress Tracking
- User can view progress over time per mode and dimension

Acceptance Criteria:
- Dashboard shows last 10 sessions and moving average

---

## 4. Non-Functional Requirements

### NFR-1 Usability
- Simple, low-friction UX suitable for first-time users

### NFR-2 Performance
- p95 per-answer feedback latency <= 6 seconds

### NFR-3 Reliability
- Graceful degradation for AI/STT failures
- No hard crash during active session

### NFR-4 Scalability
- Support at least 500 daily active users in MVP infra

### NFR-5 Security
- Secure auth, encrypted transport, basic abuse controls

### NFR-6 Observability
- Error rates and latency by service are measurable

---

## 5. AI Requirements

### AI-1 Centrality
- AI is required for evaluation, adaptation, and feedback generation

### AI-2 Structured Outputs
- LLM outputs must follow strict JSON schema

### AI-3 Responsible Feedback
- Tone is constructive and bias-aware
- Do not penalize accent/fluency where reasoning is clear

### AI-4 Explainability
- Every adaptive jump includes machine-readable reason code

---

## 6. Data and Privacy Requirements

- No permanent storage of raw voice audio in MVP
- Transcript retention configurable per user consent
- Separate user identity data from evaluation artifacts

---

## 7. KPIs

- Session completion rate
- Average score improvement over 4 sessions
- Weekly returning users
- p95 evaluation latency
- Feedback usefulness rating (1-5)

---

## 8. Release Scope

### MVP (Hackathon)
- Auth, session flow, voice/STT, AI evaluation, summary, basic dashboard

### Post-MVP
- Resume-aware question personalization
- Company-specific interview packs
- Multi-language mode
- Peer/team practice spaces

---

## 9. Constraints

- Limited API credits
- Small engineering team
- Prototype deployment budget

## 10. Assumptions

- Users have stable internet and mic access
- External AI/STT providers are available during usage window
