import { useState, useEffect } from "react";
import api from "../services/api";
import {
  BookOpen,
  Sparkles,
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Lightbulb,
  MessageSquare,
  Code,
} from "lucide-react";

// Helper functions to safely extract text from structured data
const extractText = (value) => {
  if (typeof value === "string") return value;
  if (value === null || value === undefined) return "";
  if (typeof value === "object") {
    // Try to extract text from common object patterns
    if (value.text) return value.text;
    if (value.description) return value.description;
    if (value.answer) return value.answer;
    if (value.content) return value.content;
    // Try to combine paragraph fields
    const paragraphs = [];
    for (let i = 1; i <= 10; i++) {
      const key = `paragraph${i}`;
      if (value[key]) paragraphs.push(value[key]);
    }
    if (paragraphs.length > 0) return paragraphs.join("\n\n");
    // Last resort: stringify, but avoid rendering objects directly
    return JSON.stringify(value);
  }
  return String(value);
};

const extractExplanation = (explanation) => {
  if (typeof explanation === "string") return explanation;
  if (typeof explanation === "object" && explanation !== null) {
    // Check if it's a multi-paragraph structure
    const paragraphs = [];
    for (let i = 1; i <= 10; i++) {
      const key = `paragraph${i}`;
      if (explanation[key]) paragraphs.push(explanation[key]);
    }
    if (paragraphs.length > 0) return paragraphs.join("\n\n");
    // Fallback to description or text field
    return (
      explanation.description || explanation.text || extractText(explanation)
    );
  }
  return String(explanation) || "";
};

const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  :root {
    --bg:          #0a0a0f;
    --surface:     #1a1a24;
    --surface-2:   #252533;
    --border:      #3a3a4a;
    --text-1:      #f0f0f3;
    --text-2:      #a8a8b3;
    --text-3:      #6a6a7a;
    --accent:      #ff6b35;
    --accent-soft: rgba(255, 107, 53, 0.15);
    --green:       #10b981;
    --green-soft:  rgba(16, 185, 129, 0.15);
    --purple:      #a855f7;
    --purple-soft: rgba(168, 85, 247, 0.15);
    --blue:        #3b82f6;
    --blue-soft:   rgba(59, 130, 246, 0.15);
    --shadow-sm:   0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
    --shadow-md:   0 4px 16px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.2);
    --radius:      14px;
    --radius-sm:   10px;
    --font-display: 'Syne', sans-serif;
    --font-body:    'DM Sans', sans-serif;
  }

  [data-theme="light"] {
    --bg:          #f7f5f2;
    --surface:     #ffffff;
    --surface-2:   #f0ede8;
    --border:      #e8e3db;
    --text-1:      #1a1714;
    --text-2:      #6b6560;
    --text-3:      #a09890;
    --accent-soft: #fde8dc;
    --green-soft:  #d1fae5;
    --purple-soft: rgba(168, 85, 247, 0.1);
    --blue-soft:   rgba(59, 130, 246, 0.1);
    --shadow-sm:   0 1px 3px rgba(26,23,20,.06), 0 1px 2px rgba(26,23,20,.04);
    --shadow-md:   0 4px 16px rgba(26,23,20,.08), 0 2px 6px rgba(26,23,20,.04);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .pp-root {
    max-width: 1040px;
    margin: 0 auto;
    padding: 36px 24px 80px;
    font-family: var(--font-body);
    color: var(--text-1);
    background: var(--bg);
    min-height: 100vh;
    transition: background 0.3s ease, color 0.3s ease;
  }

  /* Header */
  .pp-header { 
    margin-bottom: 32px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 20px;
  }
  .pp-title {
    font-family: var(--font-display);
    font-size: clamp(2rem, 4vw, 2.8rem);
    font-weight: 800;
    letter-spacing: -.04em;
    line-height: 1;
  }
  .pp-title span { color: var(--accent); }
  .pp-subtitle { font-size: 14px; color: var(--text-3); margin-top: 7px; font-weight: 300; }

  /* Tabs */
  .pp-tabs {
    display: flex;
    gap: 12px;
    margin-bottom: 28px;
    border-bottom: 1px solid var(--border);
  }
  .pp-tab {
    padding: 12px 16px;
    border: none;
    background: transparent;
    color: var(--text-2);
    cursor: pointer;
    font-family: var(--font-body);
    font-size: 13px;
    font-weight: 600;
    border-bottom: 2px solid transparent;
    transition: all 0.2s;
  }
  .pp-tab.active {
    color: var(--accent);
    border-bottom-color: var(--accent);
  }
  .pp-tab:hover { color: var(--text-1); }

  /* Input card */
  .pp-input-card {
    background: linear-gradient(135deg, #1a1714 0%, #2d2721 100%);
    border-radius: var(--radius);
    padding: 30px 32px;
    margin-bottom: 28px;
  }
  .pp-input-label {
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .14em;
    color: rgba(255,255,255,.35);
    margin-bottom: 10px;
    display: block;
  }
  .pp-textarea {
    width: 100%;
    min-height: 110px;
    padding: 14px 16px;
    border-radius: var(--radius-sm);
    border: 1.5px solid rgba(255,255,255,.1);
    background: rgba(255,255,255,.07);
    color: rgba(255,255,255,.9);
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 400;
    resize: vertical;
    outline: none;
    transition: border-color .2s, background .2s;
    line-height: 1.6;
  }
  .pp-textarea::placeholder { color: rgba(255,255,255,.2); }
  .pp-textarea:focus { border-color: rgba(212,98,42,.5); background: rgba(255,255,255,.1); }

  .pp-input-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 14px;
    flex-wrap: wrap;
    gap: 12px;
  }
  .pp-hint { font-size: 12px; color: rgba(255,255,255,.25); font-weight: 400; }

  .pp-gen-btn {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 11px 24px;
    border-radius: var(--radius-sm);
    background: #f59e0b;
    color: #1a1714;
    font-family: var(--font-display);
    font-size: 14px; font-weight: 700; letter-spacing: -.01em;
    border: none; cursor: pointer;
    box-shadow: 0 4px 14px rgba(245,158,11,.35);
    transition: background .15s, transform .15s, box-shadow .15s;
    white-space: nowrap;
  }
  .pp-gen-btn:hover:not(:disabled) {
    background: #fbbf24;
    transform: translateY(-1px);
    box-shadow: 0 6px 18px rgba(245,158,11,.45);
  }
  .pp-gen-btn:disabled { opacity: .5; cursor: not-allowed; }

  /* Spinner inside button */
  .pp-spin {
    width: 14px; height: 14px;
    border: 2px solid rgba(26,23,20,.2);
    border-top-color: #1a1714;
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Error */
  .pp-error {
    display: flex; align-items: center; gap: 8px;
    background: #fef2f2; border: 1px solid #fecaca;
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    color: #b91c1c;
    font-size: 13.5px;
    margin-top: 14px;
  }

  /* Plan grid */
  .pp-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 16px;
    margin-bottom: 28px;
  }

  /* Topic card */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .pp-topic-card {
    background: var(--surface);
    border: 1.5px solid var(--border);
    border-radius: var(--radius);
    padding: 18px 20px;
    box-shadow: var(--shadow-sm);
    transition: all .2s;
    animation: fadeUp .3s ease both;
    cursor: pointer;
    position: relative;
  }
  .pp-topic-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: linear-gradient(90deg, var(--purple), var(--blue));
    border-radius: var(--radius) var(--radius) 0 0;
    opacity: 0;
    transition: opacity .2s;
  }
  .pp-topic-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
    border-color: var(--accent);
  }
  .pp-topic-card:hover::before { opacity: 1; }

  .pp-topic-name {
    font-family: var(--font-display);
    font-size: 0.95rem;
    font-weight: 700;
    color: var(--text-1);
    margin-bottom: 6px;
  }
  .pp-topic-desc {
    font-size: 12.5px;
    color: var(--text-2);
    line-height: 1.5;
  }

  /* Section card */
  .pp-section-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px 22px;
    box-shadow: var(--shadow-sm);
    transition: box-shadow .2s, transform .2s;
    animation: fadeUp .35s ease both;
    position: relative;
    overflow: hidden;
  }
  .pp-section-card::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--accent), #e8864a);
    border-radius: var(--radius) var(--radius) 0 0;
  }
  .pp-section-card:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }

  .pp-card-num {
    font-family: var(--font-display);
    font-size: .75rem;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: .12em;
    color: var(--accent);
    margin-bottom: 6px;
  }
  .pp-card-title {
    font-family: var(--font-display);
    font-size: 1.05rem;
    font-weight: 700;
    letter-spacing: -.02em;
    color: var(--text-1);
    margin-bottom: 18px;
  }

  .pp-list-label {
    font-size: 10.5px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .12em;
    color: var(--text-3);
    margin-bottom: 8px;
    display: flex; align-items: center; gap: 6px;
  }
  .pp-list-label svg { flex-shrink: 0; }

  .pp-list { display: flex; flex-direction: column; gap: 7px; margin-bottom: 18px; }
  .pp-list:last-child { margin-bottom: 0; }

  .pp-list-item {
    display: flex; align-items: flex-start; gap: 8px;
    font-size: 13.5px; color: var(--text-2); line-height: 1.55;
  }
  .pp-list-item svg { flex-shrink: 0; margin-top: 2px; }
  .pp-list-item svg.task { color: var(--accent); }
  .pp-list-item svg.outcome { color: var(--green); }

  .pp-card-divider { border: none; border-top: 1px solid var(--border); margin: 16px 0; }

  /* Learning detail panel */
  .pp-learning-panel {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    margin-bottom: 28px;
    animation: fadeUp .3s ease;
  }

  .pp-learning-header {
    background: linear-gradient(135deg, var(--purple-soft), var(--blue-soft));
    padding: 20px 24px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    cursor: pointer;
    user-select: none;
  }

  .pp-learning-title {
    display: flex;
    align-items: center;
    gap: 12px;
    margin: 0;
  }

  .pp-learning-title h3 {
    font-family: var(--font-display);
    font-size: 1.1rem;
    font-weight: 700;
    color: var(--text-1);
  }

  .pp-learning-content {
    padding: 24px;
    max-height: 2000px;
    overflow: hidden;
    transition: max-height 0.3s ease;
  }

  .pp-learning-content.collapsed {
    max-height: 0;
    padding: 0 24px;
  }

  .pp-section-block {
    margin-bottom: 24px;
  }

  .pp-section-block:last-child {
    margin-bottom: 0;
  }

  .pp-section-heading {
    font-family: var(--font-display);
    font-size: 0.9rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .12em;
    color: var(--accent);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .pp-section-heading svg {
    flex-shrink: 0;
  }

  .pp-definition {
    background: var(--surface-2);
    border-left: 3px solid var(--accent);
    padding: 14px 16px;
    border-radius: var(--radius-sm);
    font-size: 14px;
    line-height: 1.6;
    color: var(--text-1);
    margin-bottom: 16px;
  }

  .pp-explanation {
    font-size: 14px;
    line-height: 1.7;
    color: var(--text-2);
    margin-bottom: 18px;
    white-space: pre-wrap;
    word-wrap: break-word;
  }

  .pp-key-points {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .pp-key-point {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    font-size: 13.5px;
    color: var(--text-2);
    line-height: 1.5;
  }

  .pp-key-point::before {
    content: '◆';
    color: var(--blue);
    flex-shrink: 0;
    margin-top: 2px;
  }

  .pp-examples-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .pp-example-item {
    background: var(--surface-2);
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    font-size: 13.5px;
    color: var(--text-2);
    line-height: 1.6;
    border-left: 3px solid var(--green);
  }

  .pp-qa-block {
    background: var(--surface-2);
    border-radius: var(--radius);
    padding: 16px;
    margin-bottom: 12px;
    border: 1px solid rgba(168, 85, 247, 0.2);
  }

  .pp-qa-block:last-child {
    margin-bottom: 0;
  }

  .pp-question {
    font-weight: 600;
    color: var(--accent);
    margin-bottom: 8px;
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }

  .pp-question::before {
    content: 'Q:';
    flex-shrink: 0;
  }

  .pp-answer {
    color: var(--text-2);
    font-size: 13.5px;
    line-height: 1.6;
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }

  .pp-answer::before {
    content: 'A:';
    color: var(--green);
    font-weight: 600;
    flex-shrink: 0;
  }

  /* Stagger cards */
  .pp-section-card:nth-child(1) { animation-delay: .08s }
  .pp-section-card:nth-child(2) { animation-delay: .14s }
  .pp-section-card:nth-child(3) { animation-delay: .20s }
  .pp-section-card:nth-child(4) { animation-delay: .26s }
  .pp-section-card:nth-child(5) { animation-delay: .32s }
  .pp-section-card:nth-child(6) { animation-delay: .38s }

  .pp-topic-card:nth-child(1) { animation-delay: .05s }
  .pp-topic-card:nth-child(2) { animation-delay: .10s }
  .pp-topic-card:nth-child(3) { animation-delay: .15s }
  .pp-topic-card:nth-child(4) { animation-delay: .20s }
  .pp-topic-card:nth-child(5) { animation-delay: .25s }
  .pp-topic-card:nth-child(6) { animation-delay: .30s }
  .pp-topic-card:nth-child(7) { animation-delay: .35s }

  .pp-empty-state {
    text-align: center;
    padding: 40px 20px;
    color: var(--text-3);
  }

  .pp-empty-state-icon {
    font-size: 40px;
    margin-bottom: 12px;
    opacity: 0.5;
  }

  .pp-empty-state-title {
    font-family: var(--font-display);
    font-size: 1.2rem;
    font-weight: 700;
    margin-bottom: 8px;
    color: var(--text-2);
  }

  .pp-empty-state-text {
    font-size: 14px;
    color: var(--text-3);
  }
`;

export default function Preparation() {
  const [activeTab, setActiveTab] = useState("suggested"); // "suggested" or "custom"
  const [topicsInput, setTopicsInput] = useState(
    "arrays, system design, behavioral communication",
  );
  const [loading, setLoading] = useState(false);
  const [suggestedLoading, setSuggestedLoading] = useState(false);
  const [plan, setPlan] = useState(null);
  const [suggestedTopics, setSuggestedTopics] = useState([]);
  const [error, setError] = useState("");
  const [expandedConcept, setExpandedConcept] = useState(null);
  const [conceptLearning, setConceptLearning] = useState({});
  const [conceptLoading, setConceptLoading] = useState(false);
  const [performanceSummary, setPerformanceSummary] = useState(null);
  const [hasInterviewHistory, setHasInterviewHistory] = useState(false);

  // Load suggested topics on mount
  useEffect(() => {
    loadSuggestedTopics();
  }, []);

  const loadSuggestedTopics = async () => {
    setSuggestedLoading(true);
    try {
      // Try to get personalized topics based on interview performance
      const personalizedResponse = await api.get(
        "/profile/preparation/personalized-topics",
      );
      const personalizedData = personalizedResponse.data;

      setHasInterviewHistory(personalizedData.has_interview_history || false);
      if (personalizedData.performance_summary) {
        setPerformanceSummary(personalizedData.performance_summary);
      }

      // If personalized topics are available, use them
      if (personalizedData.topics && personalizedData.topics.length > 0) {
        setSuggestedTopics(personalizedData.topics);
        setSuggestedLoading(false);
        return;
      }

      // Otherwise fall back to profile-based suggestions
      const response = await api.get("/profile/preparation/suggested-topics");
      setSuggestedTopics(response.data.topics || []);
    } catch (e) {
      console.error("Failed to load suggested topics:", e);
      setHasInterviewHistory(false);
      // Use fallback static topics
      setSuggestedTopics([
        {
          name: "Data Structures",
          description: "Arrays, Linked Lists, Trees, Graphs, Hash Tables",
        },
        {
          name: "Algorithms & Complexity",
          description: "Sorting, Searching, Dynamic Programming",
        },
        {
          name: "System Design",
          description: "Scalability, Load Balancing, Databases",
        },
        {
          name: "Object-Oriented Design",
          description: "SOLID principles, Design Patterns",
        },
        {
          name: "Database Design",
          description: "SQL, NoSQL, Indexing, Optimization",
        },
        {
          name: "Communication & Soft Skills",
          description: "STAR method, Teamwork, Leadership",
        },
      ]);
    } finally {
      setSuggestedLoading(false);
    }
  };

  const generatePlan = async () => {
    const topics = topicsInput
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    if (!topics.length) {
      setError("Please enter at least one topic.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.post("/profile/preparation/plan", { topics });
      setPlan(response.data.plan);
    } catch (e) {
      setError(
        e.response?.data?.detail ||
          "Failed to generate plan. Please try again.",
      );
      setPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const loadConceptLearning = async (concept) => {
    if (conceptLearning[concept]) {
      setExpandedConcept(expandedConcept === concept ? null : concept);
      return;
    }

    setConceptLoading(true);
    try {
      const response = await api.post("/profile/preparation/concept-learning", {
        concept,
      });
      setConceptLearning({
        ...conceptLearning,
        [concept]: response.data.learning_material,
      });
      setExpandedConcept(expandedConcept === concept ? null : concept);
    } catch (e) {
      setError(
        e.response?.data?.detail ||
          "Failed to load concept details. Please try again.",
      );
    } finally {
      setConceptLoading(false);
    }
  };

  const toggleTopicExpand = (topicName) => {
    loadConceptLearning(topicName);
  };

  return (
    <>
      <style>{STYLE}</style>
      <div className="pp-root">
        {/* Header */}
        <div className="pp-header">
          <div>
            <h1 className="pp-title">
              Preparation<span>.</span>
            </h1>
            <p className="pp-subtitle">
              Master interview topics with AI-powered learning materials and
              practice questions.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="pp-tabs">
          <button
            className={`pp-tab ${activeTab === "suggested" ? "active" : ""}`}
            onClick={() => setActiveTab("suggested")}
          >
            <Lightbulb
              size={14}
              style={{ display: "inline", marginRight: "6px" }}
            />
            Suggested Topics
          </button>
          <button
            className={`pp-tab ${activeTab === "custom" ? "active" : ""}`}
            onClick={() => setActiveTab("custom")}
          >
            <BookOpen
              size={14}
              style={{ display: "inline", marginRight: "6px" }}
            />
            Custom Plan
          </button>
        </div>

        {/* Suggested Topics Tab */}
        {activeTab === "suggested" && (
          <div>
            {/* Performance Summary */}
            {hasInterviewHistory && performanceSummary && (
              <div
                style={{
                  background:
                    "linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(59, 130, 246, 0.1))",
                  border: "1px solid rgba(168, 85, 247, 0.3)",
                  borderRadius: "var(--radius)",
                  padding: "20px 24px",
                  marginBottom: "28px",
                  backdropFilter: "blur(10px)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    marginBottom: "12px",
                  }}
                >
                  <Sparkles size={18} style={{ color: "var(--accent)" }} />
                  <h3
                    style={{
                      margin: 0,
                      fontSize: "1.05rem",
                      fontWeight: 700,
                      color: "var(--text-1)",
                    }}
                  >
                    Your Personalized Learning Path
                  </h3>
                </div>
                <p
                  style={{
                    margin: "0 0 12px 0",
                    fontSize: "13px",
                    color: "var(--text-2)",
                    lineHeight: 1.6,
                  }}
                >
                  Based on your interview performance, we've selected topics
                  that will help you improve in areas where you scored lower.
                  Keep practicing to strengthen these skills.
                </p>
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-3)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        letterSpacing: ".1em",
                        marginBottom: "4px",
                      }}
                    >
                      Interviews Completed
                    </div>
                    <div
                      style={{
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        color: "var(--accent)",
                      }}
                    >
                      {performanceSummary.completed_interviews}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: "11px",
                        color: "var(--text-3)",
                        textTransform: "uppercase",
                        fontWeight: 700,
                        letterSpacing: ".1em",
                        marginBottom: "4px",
                      }}
                    >
                      Average Score
                    </div>
                    <div
                      style={{
                        fontSize: "1.3rem",
                        fontWeight: 700,
                        color: "var(--green)",
                      }}
                    >
                      {performanceSummary.average_score.toFixed(1)}%
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="pp-grid">
              {suggestedLoading ? (
                <div className="pp-empty-state">
                  <div
                    className="pp-spin"
                    style={{ margin: "0 auto 12px" }}
                  ></div>
                  <div className="pp-empty-state-title">Loading topics...</div>
                </div>
              ) : suggestedTopics.length > 0 ? (
                suggestedTopics.map((topic, idx) => (
                  <div
                    key={idx}
                    className="pp-topic-card"
                    onClick={() => toggleTopicExpand(topic.name)}
                    style={{ cursor: conceptLoading ? "progress" : "pointer" }}
                  >
                    <div className="pp-topic-name">{topic.name}</div>
                    <div className="pp-topic-desc">{topic.description}</div>
                    <div
                      style={{
                        marginTop: "12px",
                        fontSize: "11px",
                        color: "var(--text-3)",
                      }}
                    >
                      👉 Click to learn more
                    </div>
                  </div>
                ))
              ) : (
                <div className="pp-empty-state">
                  <div className="pp-empty-state-title">
                    No topics available
                  </div>
                </div>
              )}
            </div>

            {/* Message for users without interview history */}
            {!hasInterviewHistory &&
              !suggestedLoading &&
              suggestedTopics.length > 0 && (
                <div
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(168, 85, 247, 0.1))",
                    border: "1px solid rgba(59, 130, 246, 0.3)",
                    borderRadius: "var(--radius)",
                    padding: "20px 24px",
                    marginBottom: "28px",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "12px",
                    }}
                  >
                    <Lightbulb
                      size={18}
                      style={{
                        color: "var(--blue)",
                        flexShrink: 0,
                        marginTop: "2px",
                      }}
                    />
                    <div>
                      <h4
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: "0.95rem",
                          fontWeight: 700,
                          color: "var(--text-1)",
                        }}
                      >
                        General Preparation Topics
                      </h4>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "13px",
                          color: "var(--text-2)",
                          lineHeight: 1.6,
                        }}
                      >
                        Complete some interviews to get personalized
                        recommendations tailored to your performance. In the
                        meantime, these general topics are great for
                        foundational preparation.
                      </p>
                    </div>
                  </div>
                </div>
              )}

            {/* Learning Panel for Suggested Topics */}
            {expandedConcept && conceptLearning[expandedConcept] && (
              <div className="pp-learning-panel">
                <div
                  className="pp-learning-header"
                  onClick={() => setExpandedConcept(null)}
                >
                  <div className="pp-learning-title">
                    <Code size={20} style={{ color: "var(--accent)" }} />
                    <h3>{expandedConcept}</h3>
                  </div>
                  <ChevronUp size={20} style={{ color: "var(--text-2)" }} />
                </div>

                <div className="pp-learning-content">
                  {/* Definition */}
                  <div className="pp-section-block">
                    <div className="pp-section-heading">
                      <Lightbulb size={14} />
                      Definition
                    </div>
                    <div className="pp-definition">
                      {extractText(conceptLearning[expandedConcept].definition)}
                    </div>
                  </div>

                  {/* Explanation */}
                  {conceptLearning[expandedConcept].explanation && (
                    <div className="pp-section-block">
                      <div className="pp-section-heading">
                        <BookOpen size={14} />
                        Detailed Explanation
                      </div>
                      <div className="pp-explanation">
                        {extractExplanation(
                          conceptLearning[expandedConcept].explanation,
                        )}
                      </div>
                    </div>
                  )}

                  {/* Key Points */}
                  {conceptLearning[expandedConcept].key_points?.length > 0 && (
                    <div className="pp-section-block">
                      <div className="pp-section-heading">
                        <CheckCircle2 size={14} />
                        Key Points
                      </div>
                      <div className="pp-key-points">
                        {conceptLearning[expandedConcept].key_points.map(
                          (point, idx) => (
                            <div key={idx} className="pp-key-point">
                              {extractText(point)}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Examples */}
                  {conceptLearning[expandedConcept].examples?.length > 0 && (
                    <div className="pp-section-block">
                      <div className="pp-section-heading">
                        <Sparkles size={14} />
                        Real-World Examples
                      </div>
                      <div className="pp-examples-list">
                        {conceptLearning[expandedConcept].examples.map(
                          (example, idx) => (
                            <div key={idx} className="pp-example-item">
                              {extractText(example)}
                            </div>
                          ),
                        )}
                      </div>
                    </div>
                  )}

                  {/* Interview Questions */}
                  {conceptLearning[expandedConcept].interview_questions
                    ?.length > 0 && (
                    <div className="pp-section-block">
                      <div className="pp-section-heading">
                        <MessageSquare size={14} />
                        Common Interview Questions & Answers
                      </div>
                      <div>
                        {conceptLearning[
                          expandedConcept
                        ].interview_questions.map((qa, idx) => (
                          <div key={idx} className="pp-qa-block">
                            <div className="pp-question">
                              {extractText(qa.question || qa)}
                            </div>
                            <div className="pp-answer">
                              {extractText(qa.answer || qa)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Custom Plan Tab */}
        {activeTab === "custom" && (
          <div>
            {/* Input card */}
            <div className="pp-input-card">
              <label className="pp-input-label">Topics — comma separated</label>
              <textarea
                className="pp-textarea"
                value={topicsInput}
                onChange={(e) => setTopicsInput(e.target.value)}
                placeholder="e.g. dynamic programming, distributed systems, conflict resolution"
              />
              <div className="pp-input-footer">
                <span className="pp-hint">
                  Each topic becomes a dedicated section in your plan.
                </span>
                <button
                  className="pp-gen-btn"
                  onClick={generatePlan}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="pp-spin" /> Generating…
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} /> Generate Plan
                    </>
                  )}
                </button>
              </div>
              {error && (
                <div className="pp-error">
                  <AlertCircle size={14} />
                  {error}
                </div>
              )}
            </div>

            {/* Plan sections */}
            {plan?.sections?.length > 0 && (
              <div className="pp-grid">
                {plan.sections.map((section, idx) => (
                  <div
                    key={`${section.title}-${idx}`}
                    className="pp-section-card"
                    onClick={() => toggleTopicExpand(section.title)}
                    style={{ cursor: conceptLoading ? "progress" : "pointer" }}
                  >
                    <div className="pp-card-num">Section {idx + 1}</div>
                    <div className="pp-card-title">{section.title}</div>

                    {section.tasks?.length > 0 && (
                      <>
                        <div className="pp-list-label">
                          <ArrowRight
                            size={11}
                            style={{ color: "var(--accent)" }}
                          />
                          Tasks
                        </div>
                        <div className="pp-list">
                          {section.tasks.map((task, i) => (
                            <div key={i} className="pp-list-item">
                              <ArrowRight size={13} className="task" />
                              {extractText(task)}
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {section.outcomes?.length > 0 && (
                      <>
                        <hr className="pp-card-divider" />
                        <div className="pp-list-label">
                          <CheckCircle2
                            size={11}
                            style={{ color: "var(--green)" }}
                          />
                          Outcomes
                        </div>
                        <div className="pp-list">
                          {section.outcomes.map((outcome, i) => (
                            <div key={i} className="pp-list-item">
                              <CheckCircle2 size={13} className="outcome" />
                              {extractText(outcome)}
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                    <div
                      style={{
                        marginTop: "12px",
                        fontSize: "11px",
                        color: "var(--text-3)",
                      }}
                    >
                      👉 Click to learn more
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Learning Panel for Custom Plan Topics */}
            {expandedConcept &&
              conceptLearning[expandedConcept] &&
              activeTab === "custom" && (
                <div className="pp-learning-panel">
                  <div
                    className="pp-learning-header"
                    onClick={() => setExpandedConcept(null)}
                  >
                    <div className="pp-learning-title">
                      <Code size={20} style={{ color: "var(--accent)" }} />
                      <h3>{expandedConcept}</h3>
                    </div>
                    <ChevronUp size={20} style={{ color: "var(--text-2)" }} />
                  </div>

                  <div className="pp-learning-content">
                    {/* Definition */}
                    <div className="pp-section-block">
                      <div className="pp-section-heading">
                        <Lightbulb size={14} />
                        Definition
                      </div>
                      <div className="pp-definition">
                        {extractText(
                          conceptLearning[expandedConcept].definition,
                        )}
                      </div>
                    </div>

                    {/* Explanation */}
                    {conceptLearning[expandedConcept].explanation && (
                      <div className="pp-section-block">
                        <div className="pp-section-heading">
                          <BookOpen size={14} />
                          Detailed Explanation
                        </div>
                        <div className="pp-explanation">
                          {extractExplanation(
                            conceptLearning[expandedConcept].explanation,
                          )}
                        </div>
                      </div>
                    )}

                    {/* Key Points */}
                    {conceptLearning[expandedConcept].key_points?.length >
                      0 && (
                      <div className="pp-section-block">
                        <div className="pp-section-heading">
                          <CheckCircle2 size={14} />
                          Key Points
                        </div>
                        <div className="pp-key-points">
                          {conceptLearning[expandedConcept].key_points.map(
                            (point, idx) => (
                              <div key={idx} className="pp-key-point">
                                {extractText(point)}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {/* Examples */}
                    {conceptLearning[expandedConcept].examples?.length > 0 && (
                      <div className="pp-section-block">
                        <div className="pp-section-heading">
                          <Sparkles size={14} />
                          Real-World Examples
                        </div>
                        <div className="pp-examples-list">
                          {conceptLearning[expandedConcept].examples.map(
                            (example, idx) => (
                              <div key={idx} className="pp-example-item">
                                {extractText(example)}
                              </div>
                            ),
                          )}
                        </div>
                      </div>
                    )}

                    {/* Interview Questions */}
                    {conceptLearning[expandedConcept].interview_questions
                      ?.length > 0 && (
                      <div className="pp-section-block">
                        <div className="pp-section-heading">
                          <MessageSquare size={14} />
                          Common Interview Questions & Answers
                        </div>
                        <div>
                          {conceptLearning[
                            expandedConcept
                          ].interview_questions.map((qa, idx) => (
                            <div key={idx} className="pp-qa-block">
                              <div className="pp-question">
                                {extractText(qa.question || qa)}
                              </div>
                              <div className="pp-answer">
                                {extractText(qa.answer || qa)}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        )}
      </div>
    </>
  );
}
