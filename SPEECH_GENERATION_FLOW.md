# Interviewbit - Speech Generation Working Architecture

## Overview

**Interviewbit** is an **AI-Powered Interview Practice Platform** with multi-directional speech capabilities:

    - Question speech synthesis (Text-to-Speech)
    - User answer speech-to-text conversion
    - AI-based answer evaluation
    - Real-time feedback with visual interface

    ---

    ## 🎯 Complete Interview Flow

    ### 1. **SESSION CREATION & START**

    ```
    Client (React)                Backend (FastAPI)           AWS Services
    |                              |                            |
    |--createSession()------------>|                            |
    |                              |                            |
    |<--sessionId returned---------|                            |
    |                              |                            |
    |--startSession()------------->|                            |
    |                              |--generate_question()------>| Bedrock
    |                              |<--question_text-----------|
    |<--1st question + ID----------|                            |
    |                              |                            |
    ```

    **Key Route:** `POST /api/v1/sessions/{session_id}/start`

    **What happens:**

    1. User creates session with interview mode (System Design, DSA, etc.) and difficulty (1-5)
    2. Backend initializes `InterviewEngine` and `SessionStateMachine`
    3. AWS **Bedrock Claude 3 Haiku** generates first question based on:
    - Interview mode
    - Difficulty level
    - User's preferred tech stack
    - User's preferred roles
    4. Question returned to frontend with unique `question_id` and `session_id`

    ---

    ## 🔊 Step 1: QUESTION SPEECH SYNTHESIS (Text-to-Speech)

    ### Frontend: [Interview.jsx](client/src/pages/Interview.jsx#L1400)

    ```javascript
    // When question loads, automatically speak it
    useEffect(() => {
    if (question?.question_text) speakQuestion(question.question_text);
    }, [question?.id]);

    const speakQuestion = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95; // Speaking speed
    utterance.pitch = 1; // Voice pitch
    utterance.volume = 1; // Full volume

    utterance.onend = () => {
        // Auto-start recording if "hands-free" mode enabled
        if (handsFree && !evaluation && !isRecording) startRecording();
    };

    window.speechSynthesis.speak(utterance);
    };
    ```

    **Features:**

    - Uses **Web Speech API** (browser native TTS)
    - No external API calls for TTS
    - Adjustable speech rate (0.95) and pitch
    - Auto-triggers recording when speech finishes
    - Supports "hands-free" interview mode

    ---

    ## 🎤 Step 2: AUDIO RECORDING (User Answer Capture)

    ### Frontend: Recording Flow

    ```javascript
    const startRecording = async () => {
    // Request microphone access
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

    const mediaRecorder = new MediaRecorder(stream);
    audioChunksRef.current = [];
    startTimeRef.current = Date.now();

    // Collect audio data every 1 second
    mediaRecorder.ondataavailable = (e) => {
        audioChunksRef.current.push(e.data);
    };

    mediaRecorder.onstop = async () => {
        // Convert chunks to Blob
        const audioBlob = new Blob(audioChunksRef.current, {
        type: "audio/webm",
        });
        const duration = (Date.now() - startTimeRef.current) / 1000;

        // Submit to backend
        await submitAnswer(audioBlob, duration, questionId);
    };

    mediaRecorder.start(1000); // Start collecting
    };

    const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
    }
    };
    ```

    **Recording Details:**

    - **Codec:** WebM/Opus (browser default)
    - **Sample Rate:** 48kHz
    - **Collect Interval:** Every 1000ms
    - **Max File Size:** 10MB
    - **Validation:** Ensures audio blob is not empty

    ---

    ## 🔄 Step 3: SPEECH-TO-TEXT CONVERSION

    ### Backend: [stt_adapter/service.py](server/src/stt_adapter/service.py)

    Supports **3 providers** (configurable via `STT_PROVIDER` env var):

    #### **Option A: OpenAI Whisper API** (Recommended for Production)

    ```python
    async def _transcribe_openai(self, audio_file: UploadFile) -> str:
        # Send audio to OpenAI Whisper
        response = await self.client.audio.transcriptions.create(
            model="whisper-1",
            file=audio_bytes,
            response_format="text",
            timeout=30
        )
        return response.strip()
    ```

    #### **Option B: AWS Transcribe** (Best for AWS deployments)

    ```python
    def _transcribe_aws_transcribe(self, audio_file: UploadFile) -> str:
        # 1. Upload audio to S3
        s3_key = f"transcribe-inputs/{uuid.uuid4()}.wav"
        self.s3_client.put_object(
            Bucket=settings.AWS_TRANSCRIBE_S3_BUCKET,
            Key=s3_key,
            Body=audio_content
        )

        # 2. Start AWS Transcribe job
        job_name = f"job-{uuid.uuid4()}"
        self.transcribe_client.start_transcription_job(
            TranscriptionJobName=job_name,
            Media={'MediaFileUri': s3_uri},
            MediaFormat='webm',
            LanguageCode='en-US'
        )

        # 3. Poll job status
        while True:
            job = self.transcribe_client.get_transcription_job(...)
            if job['TranscriptionJob']['TranscriptionJobStatus'] == 'COMPLETED':
                # 4. Fetch result from S3
                transcript = fetch_from_s3(...)
                return transcript
            time.sleep(2)  # Poll every 2 seconds

        # Timeout: 600 seconds
    ```

    #### **Option C: Local Whisper** (No API calls, but slower)

    ```python
    async def _transcribe_whisper_local(self, audio_file: UploadFile) -> str:
        # Load local Whisper model
        model = self._get_whisper_model()  # Cache model in memory

        # Save audio to temp file
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as temp_file:
            temp_file.write(audio_content)
            temp_file_path = temp_file.name

        # Transcribe
        result = model.transcribe(
            temp_file_path,
            language="en",
            verbose=False
        )

        return result.get("text", "").strip()
    ```

    ### Flow Diagram:

    ```
    Audio File (WebM)
        |
        v
    [STT Service]
        |
        +-- [OpenAI API] --> Transcript
        |
        +-- [AWS Transcribe] --> S3 --> Poll Job --> Transcript
        |
        +-- [Local Whisper] --> Transcript
        |
        v
    Normalized Text
    ```

    ### Quality Checks:

    ```python
    def _is_quality_sufficient(self, transcript: str) -> bool:
        # Minimum 10 characters
        if len(transcript.strip()) < 10:
            return False

        # At least 3 meaningful words
        # (Filter out filler: "um", "uh", "er", "ah", "hmm")
        words = transcript.lower().split()
        meaningful = [w for w in words if w not in filler_words]
        return len(meaningful) >= 3

    def calculate_clarity_score(self, transcript: str, duration: float) -> float:
        # Words per minute (optimal: 120-160)
        # Filler word ratio (lower is better)
        # Scoring: 0.6 * pace_score + 0.4 * filler_score
    ```

    ---

    ## 🧠 Step 4: AI EVALUATION OF ANSWER

    ### Backend: [ai_evaluator/service.py](server/src/ai_evaluator/service.py)

    **Provider Chain** (Configurable via `AI_PROVIDER`):

    1. **Primary:** AWS Bedrock (Claude 3 Haiku or Opus)
    2. **Fallback 1:** Groq (Mixtral/LLaMA)
    3. **Fallback 2:** Google Gemini
    4. **Fallback 3:** OpenAI GPT

    ### Evaluation Prompt Structure:

    ```
    You are an expert interview evaluator.

    Evaluate this answer for: [MODE]
    Difficulty: [1-5]

    QUESTION: [question_text]
    ANSWER:   [user_transcript]

    Provide JSON with:
    - 5 dimension scores (1-5 each): critical thinking, communication, depth, clarity, structure
    - Composite score (average)
    - Strengths: [list of 2-3]
    - Improvements: [list of 2-3]
    - Next question strategy
    - Confidence level (0-1)
    ```

    ### Example Response:

    ```json
    {
    "scores": {
        "dimension_1": 4, // Critical Thinking
        "dimension_2": 3, // Communication Clarity
        "dimension_3": 4, // Technical Depth
        "dimension_4": 3, // Problem Solving
        "dimension_5": 4 // Structure & Organization
    },
    "composite_score": 3.6,
    "strengths": [
        "Solid understanding of system design principles",
        "Good explanation of tradeoffs"
    ],
    "improvements": [
        "Could discuss scalability more",
        "Need to mention caching strategies"
    ],
    "next_question_strategy": "INCREASE_DIFFICULTY",
    "eval_confidence": 0.92,
    "clarity_score": 0.85
    }
    ```

    ### Adaptive Difficulty Engine:

    ```python
    def _calculate_adaptive_difficulty(session, recent_questions):
        # Get last 2 evaluations
        scores = [eval.composite_score for _, eval in recent_questions]
        avg_score = sum(scores) / len(scores)

        # Adjust difficulty
        if avg_score >= 4.0:
            return min(5, session.difficulty_current + 1)  # Increase
        elif avg_score <= 2.0:
            return max(1, session.difficulty_current - 1)  # Decrease
        else:
            return session.difficulty_current  # Maintain
    ```

    ---

    ## 📡 Step 5: SUBMIT ANSWER API

    ### Frontend → Backend Flow:

    ```javascript
    const submitAnswer = async (audioBlob, duration, questionId) => {
    const formData = new FormData();

    // Prepare multipart form
    formData.append("audio_file", audioBlob); // Binary audio
    formData.append("audio_duration_sec", duration); // Metadata

    // POST to backend
    const result = await api.post(
        `/sessions/${sessionId}/questions/${questionId}/answer`,
        formData,
        { headers: { "Content-Type": "multipart/form-data" } },
    );

    // Response includes evaluation + transcription
    setEvaluation(result);
    setTranscript(result.transcript);
    };
    ```

    ### Backend Route: [session_engine/routes.py](server/src/session_engine/routes.py#L200)

    ```python
    @router.post("/{session_id}/questions/{question_id}/answer")
    async def submit_answer(
        session_id: str,
        question_id: str,
        audio_file: UploadFile = File(...),
        audio_duration_sec: float = Form(0),
        current_user: User = Depends(get_current_user_firebase)
    ):
        # 1. Transcribe audio
        transcript = await stt_service.transcribe(audio_file)

        # 2. Validate quality
        if not stt_service._is_quality_sufficient(transcript):
            raise HTTPException(status_code=422, detail="Answer too short/unclear")

        # 3. Calculate clarity score
        clarity = stt_service.calculate_clarity_score(transcript, audio_duration_sec)

        # 4. Evaluate answer using AI
        evaluation = await ai_evaluator.evaluate_answer(
            session=session,
            question=session_question,
            transcript=transcript
        )

        # 5. Store evaluation in Firestore
        db.collection(Collections.EVALUATIONS).document().set(
            evaluation.to_dict()
        )

        # 6. Return evaluation + metadata to frontend
        return {
            "composite_score": evaluation.composite_score,
            "score_dimension_1": evaluation.score_dimension_1,
            "score_dimension_2": evaluation.score_dimension_2,
            "score_dimension_3": evaluation.score_dimension_3,
            "score_dimension_4": evaluation.score_dimension_4,
            "score_dimension_5": evaluation.score_dimension_5,
            "strengths": evaluation.strengths,
            "improvements": evaluation.improvements,
            "transcript": transcript,
            "clarity_score": clarity,
            "eval_confidence": evaluation.eval_confidence,
            "questions_count": session.questions_count,
            "id": session_question.id
        }
    ```

    ---

    ## 🎯 Step 6: FRONTEND EVALUATION DISPLAY

    ### Evaluation Results Rendering:

    ```javascript
    const dimensionScores = deriveDimensionScores(evaluation);
    const compositeScore = calculateCompositeScore(evaluation);

    return (
    <div className="iv-eval">
        {/* Main Score */}
        <div className="iv-score-hero">
        <div className="iv-score-value">{compositeScore.toFixed(2)}</div>
        <div className="iv-score-denom">/5</div>
        <div className="iv-confidence">Confidence: {confidencePct}%</div>
        </div>

        {/* 5 Dimension Scores */}
        <div className="iv-dims">
        {dimensionScores.map((dim) => (
            <div className="iv-dim" key={dim.key}>
            <div className="iv-dim-score">{dim.value.toFixed(1)}</div>
            <div className="iv-dim-label">{dim.label}</div>
            </div>
        ))}
        </div>

        {/* Transcript */}
        <div className="iv-transcript">
        <div className="iv-transcript-label">Your Answer</div>
        <div className="iv-transcript-text">{transcript}</div>
        <div className="iv-clarity">Clarity: {clarityScore || "N/A"}</div>
        </div>

        {/* Feedback Cards */}
        <div className="iv-feedback">
        <div className="iv-fb-card">
            <h3 className="iv-fb-title green">✓ Strengths</h3>
            {strengths.map((s) => (
            <div className="iv-fb-item">{s}</div>
            ))}
        </div>
        <div className="iv-fb-card">
            <h3 className="iv-fb-title amber">⚡ Improvements</h3>
            {improvements.map((i) => (
            <div className="iv-fb-item">{i}</div>
            ))}
        </div>
        </div>
    </div>
    );
    ```

    ---

    ## 🔄 Step 7: NEXT QUESTION GENERATION

    ### Adaptive Question Generation:

    ```python
    def generate_next_question(session: InterviewSession) -> SessionQuestion:
        # 1. Get recent answers
        recent_answers = _get_recent_questions(session.id, limit=2)

        # 2. Calculate adaptive difficulty
        current_difficulty = _calculate_adaptive_difficulty(
            session,
            recent_answers
        )

        # 3. Get user preferences
        preferences = _get_user_preferences(session.user_id)

        # 4. Generate new question using Bedrock
        question_text = bedrock.generate_question(
            mode=session.mode,
            difficulty=current_difficulty,
            language=preferences.get("tech_stack")[0],
            preferred_roles=preferences.get("preferred_roles")
        )

        # 5. Store question in Firestore
        session_question = SessionQuestion(
            session_id=session.id,
            question_text=question_text,
            difficulty=current_difficulty
        )
        db.save(session_question)

        return session_question
    ```

    ---

    ## 📊 Step 8: SESSION SUMMARY

    ### Final Analysis Generation:

    ```
    After 10 questions...

    [Get Summary Route]
    |
    +-- Calculate average scores across all 5 dimensions
    |
    +-- Aggregate strengths/weaknesses
    |
    +-- Generate overall feedback
    |
    +-- Track difficulty progression
    |
    v
    Final Report with:
    - Overall score (4.2/5)
    - Dimension averages [3.8, 3.9, 4.2, 4.0, 4.1]
    - Trend analysis
    - Top strengths/improvements to focus on
    - Next interview recommendations
    ```

    ---

    ## 🔐 Authentication & Permissions

    - **Firebase Authentication:** All endpoints require valid Firebase token
    - **Audio Content Consent:** Requires user to allow microphone access
    - **Rate Limiting:** Prevents API abuse
    - **Session Ownership:** Users can only access their own sessions

    ---

    ## 🌍 Configuration Environment Variables

    ```bash
    # STT Service
    STT_PROVIDER=openai|aws_transcribe|whisper_local
    STT_MODEL=whisper-1
    STT_TIMEOUT_SEC=30
    OPENAI_API_KEY=sk-...
    AWS_TRANSCRIBE_S3_BUCKET=interview-audio-bucket
    AWS_TRANSCRIBE_S3_REGION=us-east-1

    # AI Evaluation
    AI_PROVIDER=aws_bedrock|openai|groq
    AI_MODEL=gpt-4|claude-3-opus
    AWS_BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
    AWS_BEDROCK_REGION=us-west-2

    # Question Generation (Bedrock)
    AWS_BEDROCK_MODEL_ID=...
    AWS_REGION=us-east-1

    # Database
    FIREBASE_PROJECT_ID=interview-33adc
    FIREBASE_CREDENTIALS_JSON=/path/to/credentials.json

    # Frontend
    VITE_MAX_QUESTIONS_PER_SESSION=10
    VITE_API_BASE_URL=https://api.example.com/api/v1
    ```

    ---

    ## 🎨 Key UI/UX Features

    1. **Real-time Recording Indicator:**
    - Pulsing red button during recording
    - Visual countdown timer

    2. **Auto-start/Auto-next:**
    - Question plays automatically
    - Recording starts when speech ends (hands-free mode)
    - Evaluation appears instantly after submission

    3. **Performance Dashboard:**
    - Large composite score display
    - 5-dimension radar/grid view
    - Confidence percentage

    4. **Feedback Format:**
    - Color-coded sections (green for strengths, amber for improvements)
    - Scrollable lists with icons
    - Next question strategy hints

    5. **Session Progress:**
    - Question counter (1/10)
    - Question history chips below with individual scores
    - Max questions limit enforcement

    ---

    ## 📋 Data Flow Diagram

    ```
    ┌─────────────────────────────────────────────────────────────┐
    │                    Frontend (React)                         │
    │  ┌──────────────────────────────────────────────────────┐  │
    │  │ 1. Display Question                                  │  │
    │  │ 2. Speak Question (Web Speech API)                  │  │
    │  │ 3. Record Answer (MediaRecorder)                    │  │
    │  │ 4. Stop Recording → Submit Audio                    │  │
    │  │ 5. Display Evaluation                               │  │
    │  └──────────────────────────────────────────────────────┘  │
    └──────────────────────│──────────────────────────────────────┘
                        │ HTTP/FormData
                        v
    ┌──────────────────────────────────────────────────────────────┐
    │              Backend (FastAPI + Python)                      │
    │  ┌──────────────────────────────────────────────────────┐   │
    │  │ 1. Receive Audio + Get Session Context              │   │
    │  │ 2. STT: Convert Audio → Transcript                  │   │
    │  │   (OpenAI / AWS Transcribe / Local Whisper)        │   │
    │  │ 3. Evaluate Answer: Transcript → Scores             │   │
    │  │   (AWS Bedrock / Groq / Gemini / OpenAI)           │   │
    │  │ 4. Store Evaluation in Firestore                    │   │
    │  │ 5. Generate Next Question (Adaptive)                │   │
    │  │ 6. Return Evaluation + Next Question                │   │
    │  └──────────────────────────────────────────────────────┘   │
    └──────────────────────│──────────────────────────────────────┘
                        │ JSON Response
                        v
    ┌──────────────────────────────────────────────────────────────┐
    │              External AI Services                             │
    │  - AWS Bedrock (Claude, LLaMA)                               │
    │  - AWS Transcribe                                            │
    │  - OpenAI Whisper API                                        │
    │  - OpenAI GPT-4                                              │
    │  - Groq LLM API                                              │
    │  - Google Gemini API                                         │
    └──────────────────────────────────────────────────────────────┘

    ```

    ---

    ## ✨ Advanced Features

    ### 1. **Retry Logic**

    - Question generation: 2 retries on failure
    - Transcript evaluation: 3 retries with provider fallback
    - Auto-recovery with user-friendly error messages

    ### 2. **Clarity Scoring**

    - Words-per-minute analysis (120-160 optimal)
    - Filler word detection ("um", "uh", "like", etc.)
    - Pace + filler combination score (0-1)

    ### 3. **Session State Machine**

    - INIT → ASK_QUESTION → RECORDING → EVALUATING → COMPLETE
    - Prevents invalid state transitions

    ### 4. **Adaptive Difficulty**

    - Dynamic adjustment based on recent scores
    - Prevents getting stuck at inappropriate difficulty
    - Considers user preferences for role/language

    ### 5. **Multi-Modal Output**

    - Composite score
    - 5-dimensional analysis
    - Transcript with clarity metadata
    - Strength/improvement suggestions

    ---

    ## 📈 Performance Metrics

    | Operation            | Typical Time | Provider         |
    | -------------------- | ------------ | ---------------- |
    | Generate Question    | 2-5s         | AWS Bedrock      |
    | Transcription        | 5-15s        | OpenAI Whisper   |
    | Evaluate Answer      | 3-8s         | AWS Bedrock/Groq |
    | Database Save        | <1s          | Firestore        |
    | **Total Round Trip** | **15-35s**   | Combined         |

    ---

    ## 🛠️ Debugging Tips

    ```bash
    # Check STT provider configuration
    curl -X POST http://localhost:8000/health

    # View raw transcription output
    # In Interview.jsx console: console.log(result.transcript)

    # Check Bedrock model availability
    aws bedrock list-foundation-models --region us-west-2

    # Monitor Firestore writes
    firebase emulator:firestore
    ```

    ---

    This architecture demonstrates **Interviewbit**, a modern AI-powered interview practice platform with sophisticated speech handling, adaptive learning, and real-time feedback delivery.
