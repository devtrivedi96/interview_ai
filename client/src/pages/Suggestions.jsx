import { useEffect, useState } from "react";
import { analyticsService } from "../services/analyticsService";
import { Lightbulb, Target, ArrowRight } from "lucide-react";

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
    --purple-soft: rgba(168, 85, 247, 0.1);
    --blue-soft:   rgba(59, 130, 246, 0.1);
    --shadow-sm:   0 1px 3px rgba(26,23,20,.06), 0 1px 2px rgba(26,23,20,.04);
    --shadow-md:   0 4px 16px rgba(26,23,20,.08), 0 2px 6px rgba(26,23,20,.04);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .sg-root {
    max-width: 760px;
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
  .sg-header { 
    margin-bottom: 32px;
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
  .sg-title {
    font-family: var(--font-display);
    font-size: clamp(2rem, 4vw, 2.8rem);
    font-weight: 800;
    letter-spacing: -.04em;
    line-height: 1;
  }
  .sg-title span { color: var(--accent); }
  .sg-subtitle { font-size: 14px; color: var(--text-3); margin-top: 7px; font-weight: 300; }

  /* Loading skeleton */
  .sg-skeleton-list { display: flex; flex-direction: column; gap: 12px; }
  .sg-skeleton {
    height: 72px;
    border-radius: var(--radius-sm);
    background: linear-gradient(90deg, var(--surface-2) 25%, var(--border) 50%, var(--surface-2) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.4s ease-in-out infinite;
  }
  @keyframes shimmer { 0% { background-position: 200% 0 } 100% { background-position: -200% 0 } }

  .sg-skeleton:nth-child(2) { animation-delay: .1s }
  .sg-skeleton:nth-child(3) { animation-delay: .2s }

  /* Card */
  .sg-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px 26px;
    box-shadow: var(--shadow-sm);
    margin-bottom: 20px;
  }
  .sg-card-head {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 20px;
  }
  .sg-card-title {
    font-family: var(--font-display);
    font-size: .95rem; font-weight: 700; letter-spacing: -.02em;
  }
  .sg-card-head svg { color: var(--accent); }

  /* Suggestion items */
  .sg-list { display: flex; flex-direction: column; gap: 10px; }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(8px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .sg-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 16px 18px;
    border-radius: var(--radius-sm);
    background: var(--surface-2);
    border: 1px solid var(--border);
    transition: background .15s, border-color .15s, transform .15s, box-shadow .15s;
    cursor: default;
    animation: fadeUp .3s ease both;
  }
  .sg-item:hover {
    background: var(--accent-soft);
    border-color: rgba(212,98,42,.2);
    transform: translateX(4px);
    box-shadow: var(--shadow-sm);
  }
  .sg-item:nth-child(1) { animation-delay: .06s }
  .sg-item:nth-child(2) { animation-delay: .12s }
  .sg-item:nth-child(3) { animation-delay: .18s }
  .sg-item:nth-child(4) { animation-delay: .24s }
  .sg-item:nth-child(5) { animation-delay: .30s }
  .sg-item:nth-child(6) { animation-delay: .36s }

  .sg-item-num {
    font-family: var(--font-display);
    font-size: 11px; font-weight: 800;
    color: var(--accent);
    background: var(--accent-soft);
    min-width: 26px; height: 26px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
    border: 1.5px solid rgba(212,98,42,.2);
  }
  .sg-item-text {
    font-size: 14px;
    color: var(--text-2);
    line-height: 1.6;
    padding-top: 2px;
  }

  /* Source tag */
  .sg-source {
    display: inline-flex; align-items: center; gap: 5px;
    font-size: 10.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .1em;
    padding: 4px 10px;
    border-radius: 100px;
    background: var(--accent-soft);
    color: var(--accent);
    margin-left: auto;
    flex-shrink: 0;
  }
  .sg-source.default {
    background: var(--surface-2);
    color: var(--text-3);
  }

  .sg-footer-note {
    margin-top: 22px;
    padding: 14px 16px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    font-size: 12.5px;
    color: var(--text-3);
    display: flex; align-items: flex-start; gap: 8px;
  }
  .sg-footer-note svg { color: var(--accent); flex-shrink: 0; margin-top: 1px; }

  @media (max-width: 640px) {
    .sg-root {
      padding: 24px 16px 64px;
    }
    .sg-card {
      padding: 18px 16px;
    }
    .sg-card-head {
      flex-wrap: wrap;
      gap: 8px;
    }
    .sg-source {
      margin-left: 0;
    }
    .sg-item {
      padding: 14px 12px;
      gap: 10px;
    }
  }
`;

const DEFAULTS = [
  "Structure answers with clear beginning, middle, and end.",
  "State trade-offs explicitly when giving technical decisions.",
  "Quantify impact using metrics in behavioral responses.",
];

const FALLBACKS = [
  "Practice 3 mock questions daily with a 2-minute answer limit.",
  "Record answers and review clarity and pacing.",
  "Revise one topic deeply before switching domains.",
];

export default function Suggestions() {
  const [loading, setLoading] = useState(true);
  const [focusAreas, setFocusAreas] = useState([]);
  const [isAI, setIsAI] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const insights = await analyticsService.getInsights(30);
        const dynamic = insights?.recommended_focus || [];
        if (dynamic.length) {
          setFocusAreas(dynamic);
          setIsAI(true);
        } else {
          setFocusAreas(DEFAULTS);
        }
      } catch {
        setFocusAreas(FALLBACKS);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <>
      <style>{STYLE}</style>
      <div className="sg-root">
        {/* Header */}
        <div className="sg-header">
          <div>
            <h1 className="sg-title">
              Suggestions<span>.</span>
            </h1>
            <p className="sg-subtitle">
              {isAI
                ? "AI-powered recommendations based on your recent sessions."
                : "Curated tips to sharpen your interview performance."}
            </p>
          </div>
        </div>

        <div className="sg-card">
          <div className="sg-card-head">
            <Lightbulb size={15} />
            <span className="sg-card-title">Focus Areas</span>
            {isAI && (
              <span className="sg-source">
                <Target size={10} /> AI-powered
              </span>
            )}
          </div>

          {loading ? (
            <div className="sg-skeleton-list">
              <div className="sg-skeleton" />
              <div className="sg-skeleton" />
              <div className="sg-skeleton" />
            </div>
          ) : (
            <div className="sg-list">
              {focusAreas.map((item, idx) => (
                <div key={idx} className="sg-item">
                  <span className="sg-item-num">{idx + 1}</span>
                  <span className="sg-item-text">{item}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {!loading && (
          <div className="sg-footer-note">
            <ArrowRight size={13} />
            {isAI
              ? "These suggestions are generated from your last 30 days of sessions. Complete more interviews to refine them."
              : "Start completing interviews to get personalized AI-powered recommendations tailored to your performance."}
          </div>
        )}
      </div>
    </>
  );
}
