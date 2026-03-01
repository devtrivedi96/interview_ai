import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { sessionService } from "../services/sessionService";
import {
  Mic,
  Square,
  Loader,
  Volume2,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  :root {
    --bg:          #f7f5f2;
    --surface:     #ffffff;
    --surface-2:   #f0ede8;
    --border:      #e8e3db;
    --text-1:      #1a1714;
    --text-2:      #6b6560;
    --text-3:      #a09890;
    --accent:      #d4622a;
    --accent-soft: #fde8dc;
    --green:       #22a67a;
    --green-soft:  #d1fae5;
    --amber:       #d97706;
    --amber-soft:  #fef3c7;
    --blue:        #2a6dd4;
    --blue-soft:   #dbeafe;
    --shadow-sm:   0 1px 3px rgba(26,23,20,.06), 0 1px 2px rgba(26,23,20,.04);
    --shadow-md:   0 4px 16px rgba(26,23,20,.08), 0 2px 6px rgba(26,23,20,.04);
    --radius:      14px;
    --radius-sm:   8px;
    --font-display: 'Syne', sans-serif;
    --font-body:    'DM Sans', sans-serif;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .iv-root {
    max-width: 860px;
    margin: 0 auto;
    padding: 36px 24px 80px;
    font-family: var(--font-body);
    color: var(--text-1);
  }

  /* Loading */
  .iv-loading {
    min-height: 60vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
  }
  .iv-loader-ring {
    width: 48px; height: 48px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .iv-loader-text { font-size: 14px; color: var(--text-3); font-weight: 500; }

  /* Header */
  .iv-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .iv-q-label {
    font-family: var(--font-display);
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: -.04em;
    color: var(--text-1);
  }
  .iv-q-label span { color: var(--accent); }

  .iv-badges { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
  .iv-badge {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    padding: 4px 11px;
    border-radius: 100px;
    background: var(--surface-2);
    color: var(--text-2);
    border: 1px solid var(--border);
  }
  .iv-replay-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-2);
    font-family: var(--font-body);
    font-size: 12.5px;
    font-weight: 600;
    cursor: pointer;
    transition: background .15s, color .15s;
  }
  .iv-replay-btn:hover { background: var(--accent-soft); color: var(--accent); border-color: transparent; }
  .iv-replay-btn.speaking { color: var(--accent); background: var(--accent-soft); border-color: transparent; }

  /* Question box */
  .iv-question-box {
    background: linear-gradient(135deg, #1a1714 0%, #2d2721 100%);
    border-radius: var(--radius);
    padding: 32px 36px;
    margin-bottom: 28px;
    position: relative;
    overflow: hidden;
  }
  .iv-question-box::before {
    content: '"';
    position: absolute;
    top: -20px; left: 20px;
    font-family: var(--font-display);
    font-size: 120px;
    font-weight: 800;
    color: rgba(212,98,42,.15);
    line-height: 1;
    pointer-events: none;
    user-select: none;
  }
  .iv-question-text {
    font-size: 1.2rem;
    line-height: 1.7;
    color: rgba(255,255,255,.92);
    font-weight: 400;
    position: relative;
  }

  /* Controls bar */
  .iv-controls-bar {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 14px 20px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    margin-bottom: 28px;
    flex-wrap: wrap;
    box-shadow: var(--shadow-sm);
  }
  .iv-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    font-size: 13px;
    font-weight: 500;
    color: var(--text-2);
    user-select: none;
  }
  .iv-toggle input[type=checkbox] { display: none; }
  .iv-toggle-track {
    width: 36px; height: 20px;
    background: var(--border);
    border-radius: 100px;
    position: relative;
    transition: background .2s;
    flex-shrink: 0;
  }
  .iv-toggle input:checked ~ .iv-toggle-track { background: var(--accent); }
  .iv-toggle-thumb {
    position: absolute;
    top: 3px; left: 3px;
    width: 14px; height: 14px;
    background: #fff;
    border-radius: 50%;
    box-shadow: 0 1px 4px rgba(0,0,0,.2);
    transition: left .2s;
  }
  .iv-toggle input:checked ~ .iv-toggle-track .iv-toggle-thumb { left: 19px; }

  /* Record area */
  .iv-record-area {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    padding: 40px 24px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    margin-bottom: 20px;
    box-shadow: var(--shadow-sm);
  }

  .iv-record-btn {
    width: 80px; height: 80px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    border: none;
    cursor: pointer;
    transition: transform .15s, box-shadow .2s;
    font-size: 0;
  }
  .iv-record-btn:disabled { opacity: .45; cursor: not-allowed; }
  .iv-record-btn.idle {
    background: var(--accent);
    color: #fff;
    box-shadow: 0 6px 24px rgba(212,98,42,.4);
  }
  .iv-record-btn.idle:hover:not(:disabled) {
    transform: scale(1.06);
    box-shadow: 0 8px 28px rgba(212,98,42,.5);
  }
  .iv-record-btn.recording {
    background: #1a1714;
    color: #fff;
    box-shadow: 0 6px 24px rgba(26,23,20,.3);
    animation: recordPulse 1.5s ease-in-out infinite;
  }
  @keyframes recordPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(26,23,20,.25); }
    50%       { box-shadow: 0 0 0 14px rgba(26,23,20,.06); }
  }
  .iv-record-btn.recording:hover { transform: scale(1.04); }

  .iv-record-status {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-2);
    display: flex; align-items: center; gap: 8px;
  }
  .iv-record-status.active { color: var(--accent); }
  .rec-dot {
    width: 8px; height: 8px;
    background: var(--accent);
    border-radius: 50%;
    animation: blink 1s ease-in-out infinite;
  }
  @keyframes blink { 0%,100%{opacity:1} 50%{opacity:.2} }

  .iv-evaluating {
    display: flex; align-items: center; gap: 8px;
    font-size: 13.5px; font-weight: 500; color: var(--text-3);
  }

  /* Error */
  .iv-error {
    display: flex; align-items: center; gap: 10px;
    padding: 12px 16px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: var(--radius-sm);
    color: #b91c1c;
    font-size: 13.5px;
    margin-bottom: 20px;
  }

  /* Evaluation card */
  @keyframes slideUp {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .iv-eval { animation: slideUp .35s ease both; }

  .iv-score-hero {
    background: linear-gradient(135deg, #1a1714 0%, #2d2721 100%);
    border-radius: var(--radius);
    padding: 32px 24px;
    text-align: center;
    margin-bottom: 20px;
  }
  .iv-score-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .14em;
    color: rgba(255,255,255,.4);
    margin-bottom: 10px;
  }
  .iv-score-value {
    font-family: var(--font-display);
    font-size: 4.5rem;
    font-weight: 800;
    letter-spacing: -.06em;
    color: #f59e0b;
    line-height: 1;
  }
  .iv-score-denom {
    font-size: 1.5rem;
    color: rgba(255,255,255,.3);
    font-weight: 400;
  }
  .iv-confidence {
    font-size: 12px;
    color: rgba(255,255,255,.35);
    margin-top: 8px;
    font-weight: 500;
  }

  /* Dimensions */
  .iv-dims {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }
  .iv-dim {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 14px 8px;
    text-align: center;
    box-shadow: var(--shadow-sm);
  }
  .iv-dim-score {
    font-family: var(--font-display);
    font-size: 1.4rem;
    font-weight: 800;
    letter-spacing: -.04em;
    color: var(--text-1);
  }
  .iv-dim-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .08em;
    color: var(--text-3);
    margin-top: 4px;
  }

  /* Transcript */
  .iv-transcript {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 16px 18px;
    margin-bottom: 20px;
    box-shadow: var(--shadow-sm);
  }
  .iv-transcript-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .12em;
    color: var(--text-3);
    margin-bottom: 8px;
  }
  .iv-transcript-text { font-size: 14px; color: var(--text-2); line-height: 1.6; }
  .iv-clarity { font-size: 12.5px; color: var(--text-3); margin-top: 8px; }
  .iv-clarity-warn { color: var(--amber); font-weight: 600; }

  /* Feedback grid */
  .iv-feedback {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 24px;
  }
  @media (max-width: 600px) { .iv-feedback { grid-template-columns: 1fr; } }

  .iv-fb-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 18px;
    box-shadow: var(--shadow-sm);
  }
  .iv-fb-title {
    font-family: var(--font-display);
    font-size: .9rem;
    font-weight: 700;
    margin-bottom: 12px;
    display: flex; align-items: center; gap: 8px;
  }
  .iv-fb-title.green { color: var(--green); }
  .iv-fb-title.amber { color: var(--amber); }
  .iv-fb-item {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 13.5px;
    color: var(--text-2);
    line-height: 1.5;
    padding: 6px 0;
    border-bottom: 1px solid var(--border);
  }
  .iv-fb-item:last-child { border-bottom: none; }
  .iv-fb-icon { flex-shrink: 0; margin-top: 2px; }
  .iv-fb-icon.green { color: var(--green); }
  .iv-fb-icon.amber { color: var(--amber); }

  /* Actions */
  .iv-actions {
    display: flex;
    gap: 12px;
    justify-content: center;
    flex-wrap: wrap;
  }
  .iv-btn-primary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 24px;
    border-radius: var(--radius-sm);
    background: var(--accent);
    color: #fff;
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -.01em;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(212,98,42,.35);
    transition: background .15s, transform .15s, box-shadow .15s;
  }
  .iv-btn-primary:hover {
    background: #c2571f;
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(212,98,42,.45);
  }
  .iv-btn-secondary {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 12px 24px;
    border-radius: var(--radius-sm);
    background: var(--surface);
    color: var(--text-2);
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -.01em;
    border: 1px solid var(--border);
    cursor: pointer;
    transition: background .15s, color .15s;
  }
  .iv-btn-secondary:hover { background: var(--surface-2); color: var(--text-1); }

  .iv-countdown {
    display: inline-flex; align-items: center; justify-content: center;
    width: 22px; height: 22px;
    background: rgba(255,255,255,.2);
    border-radius: 50%;
    font-size: 12px;
    font-weight: 800;
  }

  /* Next strategy */
  .iv-strategy {
    display: flex; align-items: center; gap: 8px;
    font-size: 12px; color: var(--text-3);
    margin-top: 8px;
  }
  .iv-strategy strong { color: var(--text-2); }
`;

export default function Interview() {
  const { sessionId } = useParams();
  const navigate = useNavigate();

  const [question, setQuestion] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [evaluation, setEvaluation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false);
  const [autoFlow, setAutoFlow] = useState(true);
  const [handsFree, setHandsFree] = useState(true);
  const [autoNextCountdown, setAutoNextCountdown] = useState(0);
  const [questionIndex, setQuestionIndex] = useState(1);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const startTimeRef = useRef(null);
  const utteranceRef = useRef(null);
  const autoNextTimerRef = useRef(null);

  useEffect(() => {
    loadNextQuestion();
  }, []);

  useEffect(() => {
    if (question?.question_text) speakQuestion(question.question_text);
    return () => {
      window.speechSynthesis.cancel();
      utteranceRef.current = null;
    };
  }, [question?.id]);

  useEffect(() => {
    if (!evaluation || !autoFlow) return;
    setAutoNextCountdown(4);
    autoNextTimerRef.current = setInterval(() => {
      setAutoNextCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(autoNextTimerRef.current);
          loadNextQuestion();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (autoNextTimerRef.current) clearInterval(autoNextTimerRef.current);
    };
  }, [evaluation, autoFlow]);

  const speakQuestion = (text) => {
    if (!("speechSynthesis" in window) || !text) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1;
    utterance.volume = 1;
    utterance.onstart = () => setIsSpeakingQuestion(true);
    utterance.onend = () => {
      setIsSpeakingQuestion(false);
      if (handsFree && !evaluation && !isRecording) startRecording();
    };
    utterance.onerror = () => setIsSpeakingQuestion(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const loadNextQuestion = async () => {
    if (autoNextTimerRef.current) {
      clearInterval(autoNextTimerRef.current);
      autoNextTimerRef.current = null;
    }
    setAutoNextCountdown(0);
    setLoading(true);
    setError("");
    setEvaluation(null);
    setTranscript("");
    try {
      const data = await sessionService.getNextQuestion(sessionId);
      setQuestion(data);
      setQuestionIndex((prev) => prev + (question ? 1 : 0));
    } catch (err) {
      if (err.response?.status === 400)
        navigate(`/session/${sessionId}/summary`);
      else setError("Failed to load question. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const startRecording = async () => {
    if (!question?.id) {
      setError("Question is not ready yet. Please wait a moment.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      const questionIdAtRecordStart = question.id;
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      startTimeRef.current = Date.now();
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        const duration = (Date.now() - startTimeRef.current) / 1000;
        stream.getTracks().forEach((t) => t.stop());
        await submitAnswer(audioBlob, duration, questionIdAtRecordStart);
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch {
      alert("Please allow microphone access to record your answer.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const submitAnswer = async (audioBlob, duration, questionId) => {
    setLoading(true);
    setError("");
    try {
      if (!questionId) throw new Error("Question ID missing");
      const audioFile = new File([audioBlob], "answer.webm", {
        type: "audio/webm",
      });
      // Log file size and prevent empty upload
      if (audioFile.size === 0) {
        setError("Audio file is empty. Please record your answer again.");
        alert("Audio file is empty. Please record your answer again.");
        return;
      }
      console.log("Uploading audio file size:", audioFile.size, "bytes");
      const result = await sessionService.submitAnswer(sessionId, questionId, {
        audioFile,
        audioDuration: duration,
      });
      setEvaluation(result);
      if (result.transcript) setTranscript(result.transcript);
    } catch {
      setError("Failed to evaluate answer. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    try {
      await sessionService.completeSession(sessionId);
    } catch {}
    navigate(`/session/${sessionId}/summary`);
  };

  if (loading && !question)
    return (
      <>
        <style>{STYLE}</style>
        <div className="iv-root">
          <div className="iv-loading">
            <div className="iv-loader-ring" />
            <p className="iv-loader-text">Loading your question…</p>
          </div>
        </div>
      </>
    );

  return (
    <>
      <style>{STYLE}</style>
      <div className="iv-root">
        {/* Header */}
        {question && (
          <div className="iv-header">
            <h1 className="iv-q-label">
              Question <span>#{questionIndex}</span>
            </h1>
            <div className="iv-badges">
              <span className="iv-badge">
                Difficulty {question.difficulty}/5
              </span>
              <button
                type="button"
                className={`iv-replay-btn${isSpeakingQuestion ? " speaking" : ""}`}
                onClick={() => speakQuestion(question.question_text)}
              >
                <Volume2 size={13} />
                {isSpeakingQuestion ? "Speaking…" : "Replay"}
              </button>
            </div>
          </div>
        )}

        {/* Question Box */}
        {question && (
          <div className="iv-question-box">
            <p className="iv-question-text">{question.question_text}</p>
          </div>
        )}

        {/* Controls toggles */}
        {!evaluation && (
          <div className="iv-controls-bar">
            <label className="iv-toggle">
              <input
                type="checkbox"
                checked={handsFree}
                onChange={(e) => setHandsFree(e.target.checked)}
              />
              <span className="iv-toggle-track">
                <span className="iv-toggle-thumb" />
              </span>
              Hands-free recording
            </label>
            <label className="iv-toggle">
              <input
                type="checkbox"
                checked={autoFlow}
                onChange={(e) => setAutoFlow(e.target.checked)}
              />
              <span className="iv-toggle-track">
                <span className="iv-toggle-thumb" />
              </span>
              Auto-advance
            </label>
          </div>
        )}

        {/* Recording area */}
        {!evaluation && (
          <div className="iv-record-area">
            <button
              type="button"
              className={`iv-record-btn ${isRecording ? "recording" : "idle"}`}
              onClick={isRecording ? stopRecording : startRecording}
              disabled={loading || !question || isSpeakingQuestion}
            >
              {isRecording ? (
                <Square size={28} color="#fff" />
              ) : (
                <Mic size={28} color="#fff" />
              )}
            </button>

            {isRecording && (
              <div className="iv-record-status active">
                <span className="rec-dot" />
                Recording… speak clearly
              </div>
            )}
            {!isRecording && !loading && (
              <div className="iv-record-status">
                {isSpeakingQuestion
                  ? "Listening to question…"
                  : "Tap to start recording"}
              </div>
            )}
            {loading && (
              <div className="iv-evaluating">
                <div
                  className="iv-loader-ring"
                  style={{ width: 20, height: 20, borderWidth: 2 }}
                />
                Evaluating your answer…
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="iv-error">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Evaluation */}
        {evaluation && (
          <div className="iv-eval">
            {/* Score hero */}
            <div className="iv-score-hero">
              <div className="iv-score-label">Your Score</div>
              <div className="iv-score-value">
                {evaluation.composite_score.toFixed(1)}
                <span className="iv-score-denom">/5</span>
              </div>
              <div className="iv-confidence">
                Confidence: {(evaluation.eval_confidence * 100).toFixed(0)}%
              </div>
            </div>

            {/* Dimension scores */}
            <div className="iv-dims">
              {Object.entries(evaluation.dimension_scores).map(
                ([dim, score], i) => (
                  <div key={dim} className="iv-dim">
                    <div className="iv-dim-score">{score.toFixed(1)}</div>
                    <div className="iv-dim-label">D{i + 1}</div>
                  </div>
                ),
              )}
            </div>

            {/* Transcript */}
            {transcript && (
              <div className="iv-transcript">
                <div className="iv-transcript-label">What AI Heard</div>
                <div className="iv-transcript-text">{transcript}</div>
                {typeof evaluation.clarity_score === "number" && (
                  <div className="iv-clarity">
                    Clarity:{" "}
                    <strong>{evaluation.clarity_score.toFixed(2)}</strong>
                    {!evaluation.clarity_ok && (
                      <span className="iv-clarity-warn">
                        {" "}
                        — try speaking slower for better scoring
                      </span>
                    )}
                  </div>
                )}
                {evaluation.next_question_strategy && (
                  <div className="iv-strategy">
                    <Sparkles size={12} />
                    Next strategy:{" "}
                    <strong>{evaluation.next_question_strategy}</strong>
                  </div>
                )}
              </div>
            )}

            {/* Feedback */}
            <div className="iv-feedback">
              <div className="iv-fb-card">
                <div className="iv-fb-title green">
                  <CheckCircle2 size={15} />
                  Strengths
                </div>
                {evaluation.strengths.map((s, i) => (
                  <div key={i} className="iv-fb-item">
                    <span className="iv-fb-icon green">
                      <CheckCircle2 size={13} />
                    </span>
                    {s}
                  </div>
                ))}
              </div>
              <div className="iv-fb-card">
                <div className="iv-fb-title amber">
                  <ArrowRight size={15} />
                  Areas to Improve
                </div>
                {evaluation.improvements.map((s, i) => (
                  <div key={i} className="iv-fb-item">
                    <span className="iv-fb-icon amber">
                      <ArrowRight size={13} />
                    </span>
                    {s}
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="iv-actions">
              <button className="iv-btn-primary" onClick={loadNextQuestion}>
                {autoFlow && autoNextCountdown > 0 ? (
                  <>
                    <span className="iv-countdown">{autoNextCountdown}</span>{" "}
                    Next Question
                  </>
                ) : (
                  <>
                    Next Question <ChevronRight size={15} />
                  </>
                )}
              </button>
              <button className="iv-btn-secondary" onClick={handleComplete}>
                Complete Session
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
