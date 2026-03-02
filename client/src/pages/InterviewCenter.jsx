import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sessionService } from "../services/sessionService";
import { Briefcase, Cpu, Layers3, Play, UserRound, Zap } from "lucide-react";
import ThemeToggle from "../components/ThemeToggle";

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
    --purple:      #a855f7;
    --purple-soft: rgba(168, 85, 247, 0.15);
    --blue:        #3b82f6;
    --blue-soft:   rgba(59, 130, 246, 0.15);
    --green:       #10b981;
    --green-soft:  rgba(16, 185, 129, 0.15);
    --shadow-sm:   0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
    --shadow-md:   0 4px 16px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.2);
    --shadow-lg:   0 12px 40px rgba(0, 0, 0, 0.5), 0 4px 12px rgba(0, 0, 0, 0.3);
    --radius:      16px;
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
    --purple-soft: rgba(168, 85, 247, 0.1);
    --blue-soft:   rgba(59, 130, 246, 0.1);
    --green-soft:  #d1fae5;
    --shadow-sm:   0 1px 3px rgba(26,23,20,.06), 0 1px 2px rgba(26,23,20,.04);
    --shadow-md:   0 4px 16px rgba(26,23,20,.08), 0 2px 6px rgba(26,23,20,.04);
    --shadow-lg:   0 12px 40px rgba(26,23,20,.12), 0 4px 12px rgba(26,23,20,.06);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .ic-root {
    max-width: 1080px;
    margin: 0 auto;
    padding: 36px 24px 80px;
    font-family: var(--font-body);
    color: var(--text-1);
    background: var(--bg);
    min-height: 100vh;
    transition: background 0.3s ease, color 0.3s ease;
    position: relative;
  }

  /* Header */
  .ic-header { 
    margin-bottom: 36px;
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 20px;
  }

  .theme-toggle-container {
    position: absolute;
    top: 36px;
    right: 24px;
  }
  .ic-title {
    font-family: var(--font-display);
    font-size: clamp(2rem, 4vw, 2.8rem);
    font-weight: 800;
    letter-spacing: -.04em;
    line-height: 1;
  }
  .ic-title span { color: var(--accent); }
  .ic-subtitle { font-size: 14px; color: var(--text-3); margin-top: 7px; font-weight: 300; }

  /* Section label */
  .ic-section-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .14em;
    color: var(--text-3);
    margin-bottom: 14px;
  }

  /* Mode grid */
  .ic-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 14px;
    margin-bottom: 32px;
  }

  .ic-mode-card {
    position: relative;
    background: var(--surface);
    border: 2px solid var(--border);
    border-radius: var(--radius);
    padding: 24px 22px 22px;
    cursor: pointer;
    text-align: left;
    width: 100%;
    font-family: var(--font-body);
    transition: border-color .18s, box-shadow .18s, transform .18s;
    box-shadow: var(--shadow-sm);
    overflow: hidden;
  }
  .ic-mode-card::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: calc(var(--radius) - 2px);
    background: var(--card-color, #d4622a);
    opacity: 0;
    transition: opacity .18s;
  }
  .ic-mode-card:hover {
    border-color: var(--card-color, var(--accent));
    box-shadow: var(--shadow-md);
    transform: translateY(-3px);
  }
  .ic-mode-card:hover::after { opacity: .03; }
  .ic-mode-card.active {
    border-color: var(--card-color, var(--accent));
    box-shadow: 0 0 0 4px color-mix(in srgb, var(--card-color, var(--accent)) 15%, transparent), var(--shadow-md);
    transform: translateY(-3px);
  }
  .ic-mode-card.active::after { opacity: .05; }

  /* Decorative corner shape */
  .ic-mode-card-bg {
    position: absolute;
    top: -24px; right: -24px;
    width: 80px; height: 80px;
    border-radius: 50%;
    background: var(--card-color, var(--accent));
    opacity: .07;
    transition: opacity .18s, transform .18s;
    pointer-events: none;
  }
  .ic-mode-card:hover .ic-mode-card-bg,
  .ic-mode-card.active .ic-mode-card-bg { opacity: .12; transform: scale(1.3); }

  .ic-mode-icon {
    width: 42px; height: 42px;
    border-radius: var(--radius-sm);
    background: var(--icon-bg, var(--accent-soft));
    color: var(--card-color, var(--accent));
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 16px;
    position: relative;
    transition: transform .18s;
  }
  .ic-mode-card:hover .ic-mode-icon,
  .ic-mode-card.active .ic-mode-icon { transform: scale(1.08); }

  .ic-mode-title {
    font-family: var(--font-display);
    font-size: 1.05rem;
    font-weight: 800;
    letter-spacing: -.03em;
    color: var(--text-1);
    margin-bottom: 2px;
    position: relative;
  }
  .ic-mode-subtitle {
    font-size: 11.5px;
    font-weight: 600;
    color: var(--card-color, var(--accent));
    margin-bottom: 10px;
    position: relative;
    text-transform: uppercase;
    letter-spacing: .06em;
  }
  .ic-mode-desc {
    font-size: 13px;
    color: var(--text-2);
    line-height: 1.6;
    position: relative;
  }

  .ic-active-pip {
    position: absolute;
    top: 14px; right: 14px;
    width: 10px; height: 10px;
    border-radius: 50%;
    background: var(--card-color, var(--accent));
    display: none;
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--card-color, var(--accent)) 25%, transparent);
  }
  .ic-mode-card.active .ic-active-pip { display: block; }

  /* Settings panel */
  .ic-settings {
    background: linear-gradient(135deg, #1a1714 0%, #2d2721 100%);
    border-radius: var(--radius);
    padding: 32px 36px;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
    align-items: center;
  }
  @media (max-width: 700px) { .ic-settings { grid-template-columns: 1fr; gap: 28px; padding: 24px 20px; } }

  .ic-settings-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .14em;
    color: rgba(255,255,255,.35);
    margin-bottom: 10px;
  }

  .ic-selected-mode {
    font-family: var(--font-display);
    font-size: 1.6rem;
    font-weight: 800;
    letter-spacing: -.04em;
    color: #fff;
    margin-bottom: 4px;
  }
  .ic-selected-sub {
    font-size: 13px;
    color: rgba(255,255,255,.4);
    margin-bottom: 24px;
    font-weight: 400;
  }

  /* Difficulty */
  .ic-diff-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .ic-diff-name {
    font-size: 13px;
    font-weight: 500;
    color: rgba(255,255,255,.5);
  }
  .ic-diff-val {
    font-family: var(--font-display);
    font-size: 1.4rem;
    font-weight: 800;
    letter-spacing: -.04em;
    color: #f59e0b;
  }

  input[type=range].ic-range {
    -webkit-appearance: none;
    width: 100%;
    height: 4px;
    background: rgba(255,255,255,.12);
    border-radius: 2px;
    cursor: pointer;
    outline: none;
  }
  input[type=range].ic-range::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: #f59e0b;
    box-shadow: 0 0 0 4px rgba(245,158,11,.2);
    transition: box-shadow .2s;
  }
  input[type=range].ic-range::-webkit-slider-thumb:hover {
    box-shadow: 0 0 0 7px rgba(245,158,11,.25);
  }
  .ic-diff-labels {
    display: flex; justify-content: space-between;
    margin-top: 7px;
    font-size: 10px;
    color: rgba(255,255,255,.25);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .08em;
  }

  /* Start panel */
  .ic-start-panel { }
  .ic-start-title {
    font-family: var(--font-display);
    font-size: 1.2rem;
    font-weight: 800;
    letter-spacing: -.03em;
    color: #fff;
    margin-bottom: 6px;
  }
  .ic-start-body {
    font-size: 13.5px;
    color: rgba(255,255,255,.45);
    line-height: 1.6;
    margin-bottom: 22px;
    font-weight: 300;
  }

  .ic-start-btn {
    display: inline-flex;
    align-items: center;
    gap: 9px;
    padding: 14px 28px;
    border-radius: var(--radius-sm);
    background: #f59e0b;
    color: #1a1714;
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 700;
    letter-spacing: -.02em;
    border: none;
    cursor: pointer;
    width: 100%;
    justify-content: center;
    box-shadow: 0 6px 20px rgba(245,158,11,.35);
    transition: background .15s, transform .15s, box-shadow .15s;
  }
  .ic-start-btn:hover:not(:disabled) {
    background: #fbbf24;
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(245,158,11,.45);
  }
  .ic-start-btn:active:not(:disabled) { transform: translateY(0); }
  .ic-start-btn:disabled { opacity: .5; cursor: not-allowed; }

  /* Loading skeletons */
  .ic-skeleton {
    background: linear-gradient(90deg, var(--surface-2) 25%, var(--border) 50%, var(--surface-2) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s ease-in-out infinite;
    border-radius: var(--radius);
    height: 220px;
  }
  @keyframes shimmer {
    0%   { background-position: 200% 0; }
    100% { background-position: -200% 0; }
  }

  /* Fade-up entrance */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .ic-root > * { animation: fadeUp .35s ease both; }
  .ic-root > *:nth-child(1) { animation-delay: .05s }
  .ic-root > *:nth-child(2) { animation-delay: .10s }
  .ic-root > *:nth-child(3) { animation-delay: .15s }
  .ic-root > *:nth-child(4) { animation-delay: .20s }

  .ic-grid > *:nth-child(1) { animation: fadeUp .3s .10s ease both; }
  .ic-grid > *:nth-child(2) { animation: fadeUp .3s .16s ease both; }
  .ic-grid > *:nth-child(3) { animation: fadeUp .3s .22s ease both; }
  .ic-grid > *:nth-child(4) { animation: fadeUp .3s .28s ease both; }
`;

const MODE_META = {
  DSA: { icon: Cpu, color: "#2a6dd4", iconBg: "#dbeafe" },
  HR: { icon: Briefcase, color: "#22a67a", iconBg: "#d1fae5" },
  BEHAVIORAL: { icon: UserRound, color: "#d97706", iconBg: "#fef3c7" },
  SYSTEM_DESIGN: { icon: Layers3, color: "#9333ea", iconBg: "#f3e8ff" },
};

const DEFAULT_MODES = [
  {
    key: "DSA",
    title: "DSA",
    subtitle: "Data Structures & Algorithms",
    description: "Problem solving, complexity, and coding fundamentals.",
  },
  {
    key: "HR",
    title: "HR",
    subtitle: "Behavioral & Experience",
    description: "Communication, leadership, and impact storytelling.",
  },
  {
    key: "BEHAVIORAL",
    title: "Behavioral",
    subtitle: "Situational Questions",
    description: "STAR structure and decision-making scenarios.",
  },
  {
    key: "SYSTEM_DESIGN",
    title: "System Design",
    subtitle: "Architecture & Tradeoffs",
    description: "Scalability, reliability, and API/data design.",
  },
];

const DIFF_LABELS = {
  1: "Easy",
  2: "Easy+",
  3: "Medium",
  4: "Hard",
  5: "Expert",
};

export default function InterviewCenter() {
  const navigate = useNavigate();
  const [selectedMode, setSelectedMode] = useState("DSA");
  const [difficulty, setDifficulty] = useState(3);
  const [creating, setCreating] = useState(false);
  const [cards, setCards] = useState(DEFAULT_MODES);
  const [cardsLoading, setCardsLoading] = useState(true);

  useEffect(() => {
    const loadCards = async () => {
      try {
        const data = await sessionService.getInterviewCards();
        if (Array.isArray(data?.cards) && data.cards.length > 0) {
          setCards(data.cards);
          // If current selection is not present, fall back to first card
          if (
            !data.cards.find((c) => (c.key || c.mode || c.id) === selectedMode)
          ) {
            const first = data.cards[0];
            setSelectedMode(first.key || first.mode || first.id);
            setDifficulty(Number(first.difficulty_start || 3));
          }
        }
      } catch (err) {
        console.error("Failed to load interview cards:", err);
      } finally {
        setCardsLoading(false);
      }
    };
    loadCards();
  }, []);

  const handleStartInterview = async () => {
    setCreating(true);
    try {
      // Find the active card so we can use its underlying mode
      const active = cards.find(
        (c) => (c.key || c.mode || c.id) === selectedMode,
      );
      const modeToSend = active?.mode || selectedMode;

      const session = await sessionService.createSession(
        modeToSend,
        difficulty,
      );
      await sessionService.startSession(session.id);
      navigate(`/interview/${session.id}`);
    } catch (err) {
      console.error("Failed:", err);
      alert("Failed to start interview. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const activeCard = cards.find(
    (c) => (c.key || c.mode || c.id) === selectedMode,
  );
  const activeMeta = MODE_META[selectedMode] || {
    color: "#d4622a",
    iconBg: "#fde8dc",
    icon: Cpu,
  };

  return (
    <>
      <style>{STYLE}</style>
      <div className="ic-root">
        <div className="theme-toggle-container">
          <ThemeToggle />
        </div>

        {/* Header */}
        <div className="ic-header">
          <div>
            <h1 className="ic-title">
              Interview<span>.</span>Center
            </h1>
            <p className="ic-subtitle">
              Choose a track and start your session instantly.
            </p>
          </div>
        </div>

        {/* Mode cards */}
        <div className="ic-section-label">Select Interview Track</div>
        <div className="ic-grid">
          {cardsLoading
            ? [0, 1, 2, 3].map((i) => <div key={i} className="ic-skeleton" />)
            : cards.map((mode) => {
                const key = mode.key || mode.mode || mode.id;
                const meta = MODE_META[key] || {
                  color: "#d4622a",
                  iconBg: "#fde8dc",
                  icon: Cpu,
                };
                const Icon = meta.icon;
                const active = selectedMode === key;

                return (
                  <button
                    key={key}
                    className={`ic-mode-card${active ? " active" : ""}`}
                    style={{ "--card-color": meta.color }}
                    onClick={() => {
                      setSelectedMode(key);
                      if (mode.difficulty_start)
                        setDifficulty(Number(mode.difficulty_start));
                    }}
                  >
                    <div className="ic-mode-card-bg" />
                    <div className="ic-active-pip" />
                    <div
                      className="ic-mode-icon"
                      style={{ "--icon-bg": meta.iconBg }}
                    >
                      <Icon size={18} />
                    </div>
                    <div className="ic-mode-title">{mode.title || key}</div>
                    <div className="ic-mode-subtitle">
                      {mode.subtitle || "Practice"}
                    </div>
                    <div className="ic-mode-desc">
                      {mode.description ||
                        "Practice with adaptive AI questions."}
                    </div>
                  </button>
                );
              })}
        </div>

        {/* Settings + Start */}
        <div className="ic-settings">
          {/* Difficulty */}
          <div>
            <div className="ic-settings-label">Selected Mode</div>
            <div
              className="ic-selected-mode"
              style={{ color: activeMeta.color }}
            >
              {activeCard?.title || selectedMode}
            </div>
            <div className="ic-selected-sub">
              {activeCard?.subtitle || "Interview Practice"}
            </div>

            <div className="ic-settings-label">Starting Difficulty</div>
            <div className="ic-diff-row">
              <span className="ic-diff-name">Level {difficulty} of 5</span>
              <span className="ic-diff-val">{DIFF_LABELS[difficulty]}</span>
            </div>
            <input
              type="range"
              className="ic-range"
              min="1"
              max="5"
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
            />
            <div className="ic-diff-labels">
              <span>Easy</span>
              <span>Medium</span>
              <span>Hard</span>
            </div>
          </div>

          {/* Start */}
          <div className="ic-start-panel">
            <div className="ic-start-title">Ready to begin?</div>
            <p className="ic-start-body">
              Your session will start immediately with an adaptive question
              tailored to your selected mode and difficulty.
            </p>
            <button
              className="ic-start-btn"
              onClick={handleStartInterview}
              disabled={creating || cardsLoading}
            >
              {creating ? (
                <>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      border: "2px solid rgba(26,23,20,.3)",
                      borderTopColor: "#1a1714",
                      borderRadius: "50%",
                      animation: "spin .7s linear infinite",
                    }}
                  />{" "}
                  Starting…
                </>
              ) : (
                <>
                  <Zap size={16} /> Start Session
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
