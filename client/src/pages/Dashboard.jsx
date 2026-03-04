import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sessionService } from "../services/sessionService";
import { analyticsService } from "../services/analyticsService";
import api from "../services/api";
import { useProfileStore } from "../stores/profileStore";
import { useAuthStore } from "../stores/authStore";
import PreferencesModal from "../components/PreferencesModal";
import {
  Award,
  BarChart3,
  Play,
  TrendingUp,
  User,
  Zap,
  Clock,
  ChevronRight,
  Target,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

/*
  ─────────────────────────────────────────────
  Inject global styles + Google Fonts
  ─────────────────────────────────────────────
*/
const STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;500;600;700;800&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap');

  :root {
    --bg:        #0a0a0f;
    --surface:   #16161f;
    --surface-2: #1e1e2b;
    --border:    #2a2a3d;
    --text-1:    #f0f0f5;
    --text-2:    #b0b0c0;
    --text-3:    #70707e;
    --accent:    #ff6b35;
    --accent-2:  #3b82f6;
    --accent-3:  #10b981;
    --accent-glow: rgba(255, 107, 53, 0.25);
    --accent-soft: #2a1c16;
    --purple:    #a855f7;
    --shadow-sm: 0 2px 8px rgba(0,0,0,.3), 0 1px 3px rgba(0,0,0,.2);
    --shadow-md: 0 8px 24px rgba(0,0,0,.4), 0 4px 12px rgba(0,0,0,.3);
    --shadow-lg: 0 16px 48px rgba(0,0,0,.5), 0 8px 24px rgba(0,0,0,.4);
    --shadow-glow: 0 0 40px var(--accent-glow);
    --radius:    16px;
    --radius-sm: 10px;
    --font-display: 'Syne', sans-serif;
    --font-body:    'DM Sans', sans-serif;
  }

  [data-theme="light"] {
    --bg:        #f7f5f2;
    --surface:   #ffffff;
    --surface-2: #f0ede8;
    --border:    #d8d3cb;
    --text-1:    #1a1714;
    --text-2:    #6b6560;
    --text-3:    #a09890;
    --accent:    #ff6b35;
    --accent-2:  #3b82f6;
    --accent-3:  #10b981;
    --accent-glow: rgba(255, 107, 53, 0.15);
    --accent-soft: #fde8dc;
    --purple:    #a855f7;
    --shadow-sm: 0 1px 3px rgba(26,23,20,.06), 0 1px 2px rgba(26,23,20,.04);
    --shadow-md: 0 4px 16px rgba(26,23,20,.08), 0 2px 6px rgba(26,23,20,.04);
    --shadow-lg: 0 12px 40px rgba(26,23,20,.10), 0 4px 12px rgba(26,23,20,.06);
    --shadow-glow: 0 0 20px var(--accent-glow);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .db-root {
    max-width: 1280px;
    margin: 0 auto;
    padding: 36px 28px 80px;
    min-height: 100vh;
    background: var(--bg);
    font-family: var(--font-body);
    font-size: 15px;
    color: var(--text-1);
  }

  /* ── Header ── */
  .db-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    margin-bottom: 40px;
    gap: 16px;
    flex-wrap: wrap;
  }
  .db-title {
    font-family: var(--font-display);
    font-size: clamp(2rem, 4vw, 3rem);
    font-weight: 800;
    letter-spacing: -.03em;
    line-height: 1;
    color: var(--text-1);
  }
  .db-title span {
    color: var(--accent);
  }
  .db-subtitle {
    font-size: 14px;
    color: var(--text-2);
    margin-top: 6px;
    font-weight: 300;
    letter-spacing: .01em;
  }
  .db-header-date {
    font-family: var(--font-display);
    font-size: 13px;
    font-weight: 500;
    color: var(--text-3);
    text-transform: uppercase;
    letter-spacing: .1em;
    padding: 8px 14px;
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 100px;
    box-shadow: var(--shadow-sm);
  }

  /* ── Cards ── */
  .db-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px;
    box-shadow: var(--shadow-sm);
    transition: box-shadow .2s, transform .2s;
  }
  .db-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-1px);
  }

  /* ── Stat Cards ── */
  .db-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }
  .stat-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 22px 24px;
    box-shadow: var(--shadow-sm);
    transition: box-shadow .2s, transform .2s;
    position: relative;
    overflow: hidden;
  }
  .stat-card::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 3px;
    border-radius: var(--radius) var(--radius) 0 0;
    background: var(--stripe, var(--accent));
    opacity: .8;
  }
  .stat-card:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
  .stat-icon {
    width: 36px; height: 36px;
    border-radius: var(--radius-sm);
    display: flex; align-items: center; justify-content: center;
    background: var(--icon-bg, var(--accent-soft));
    color: var(--icon-color, var(--accent));
    margin-bottom: 14px;
  }
  .stat-label {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: var(--text-3);
    margin-bottom: 6px;
  }
  .stat-value {
    font-family: var(--font-display);
    font-size: 2rem;
    font-weight: 800;
    letter-spacing: -.04em;
    color: var(--text-1);
    line-height: 1;
  }
  .stat-value.sm { font-size: 1.4rem; }

  /* ── Grid layouts ── */
  .db-grid-3 {
    display: grid;
    grid-template-columns: 1fr 2fr;
    gap: 20px;
    margin-bottom: 24px;
  }
  .db-grid-2 {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    margin-bottom: 24px;
  }
  @media (max-width: 900px) {
    .db-grid-3, .db-grid-2 { grid-template-columns: 1fr; }
  }

  /* ── Section heading ── */
  .section-head {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
  }
  .section-head svg {
    color: var(--accent);
    flex-shrink: 0;
  }
  .section-title {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 700;
    letter-spacing: -.02em;
    color: var(--text-1);
  }

  /* ── Profile snapshot ── */
  .profile-row {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }
  .profile-field { }
  .pf-label {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .12em;
    color: var(--text-3);
    margin-bottom: 2px;
  }
  .pf-value {
    font-size: 14px;
    font-weight: 500;
    color: var(--text-1);
    word-break: break-all;
  }
  .tag-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 2px; }
  .tag {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 9px;
    border-radius: 100px;
    background: var(--surface-2);
    color: var(--text-2);
    border: 1px solid var(--border);
  }
  .tag.accent {
    background: var(--accent-soft);
    color: var(--accent);
    border-color: transparent;
  }

  /* ── Recharts custom tooltip ── */
  .custom-tip {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 8px 14px;
    font-size: 13px;
    color: var(--text-1);
    box-shadow: var(--shadow-md);
    font-family: var(--font-body);
  }

  /* ── Start Interview card ── */
  .start-card {
    background: linear-gradient(135deg, #1a1714 0%, #2d2721 100%);
    border: none;
    color: #fff;
    margin-bottom: 24px;
  }
  .start-card .section-title { color: #fff; }
  .start-card .section-head svg { color: #f59e0b; }

  .form-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .1em;
    color: rgba(255,255,255,.5);
    display: block;
    margin-bottom: 8px;
  }
  .start-select {
    width: 100%;
    padding: 11px 14px;
    border-radius: var(--radius-sm);
    border: 1px solid rgba(255,255,255,.12);
    background: rgba(255,255,255,.08);
    color: #fff;
    font-family: var(--font-body);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    outline: none;
    appearance: none;
    transition: border-color .2s, background .2s;
  }
  .start-select:hover { background: rgba(255,255,255,.12); border-color: rgba(255,255,255,.2); }
  .start-select option { background: #2d2721; color: #fff; }

  .diff-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 10px;
  }
  .diff-value {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 800;
    color: #f59e0b;
  }

  input[type=range] {
    -webkit-appearance: none;
    width: 100%;
    height: 4px;
    border-radius: 2px;
    background: rgba(255,255,255,.15);
    cursor: pointer;
    outline: none;
  }
  input[type=range]::-webkit-slider-thumb {
    -webkit-appearance: none;
    width: 18px; height: 18px;
    border-radius: 50%;
    background: #f59e0b;
    box-shadow: 0 0 0 4px rgba(245,158,11,.2);
    transition: box-shadow .2s;
  }
  input[type=range]::-webkit-slider-thumb:hover {
    box-shadow: 0 0 0 6px rgba(245,158,11,.3);
  }
  .diff-labels {
    display: flex;
    justify-content: space-between;
    margin-top: 6px;
    font-size: 10px;
    color: rgba(255,255,255,.35);
    letter-spacing: .06em;
    text-transform: uppercase;
    font-weight: 600;
  }

  .start-btn {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 12px 26px;
    border-radius: var(--radius-sm);
    background: #f59e0b;
    color: #1a1714;
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 700;
    letter-spacing: -.01em;
    border: none;
    cursor: pointer;
    transition: background .2s, transform .15s, box-shadow .2s;
    box-shadow: 0 4px 16px rgba(245,158,11,.35);
    margin-top: 24px;
  }
  .start-btn:hover:not(:disabled) {
    background: #fbbf24;
    transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(245,158,11,.45);
  }
  .start-btn:active:not(:disabled) { transform: translateY(0); }
  .start-btn:disabled { opacity: .55; cursor: not-allowed; }

  .start-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 28px; }
  @media (max-width: 640px) { .start-grid { grid-template-columns: 1fr; } }

  .suggest-row {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 14px;
    border-radius: var(--radius-sm);
    background: rgba(15,15,15,.4);
    border: 1px solid rgba(255,255,255,.08);
    margin-bottom: 18px;
  }
  .suggest-label {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: .12em;
    text-transform: uppercase;
    color: rgba(255,255,255,.55);
  }
  .suggest-main {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
  }
  .suggest-title {
    font-family: var(--font-display);
    font-size: 14px;
    font-weight: 700;
  }
  .suggest-pill {
    font-size: 11px;
    padding: 4px 10px;
    border-radius: 999px;
    background: rgba(255,255,255,.08);
    color: rgba(255,255,255,.75);
  }
  .suggest-apply {
    margin-left: auto;
    padding: 6px 12px;
    border-radius: 999px;
    border: 1px solid rgba(255,255,255,.18);
    background: rgba(255,255,255,.04);
    color: #fff;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
  }
  .suggest-apply:hover { background: rgba(255,255,255,.08); }
  .suggest-questions {
    font-size: 11.5px;
    color: rgba(255,255,255,.72);
  }
  .suggest-questions ul {
    margin: 4px 0 0;
    padding-left: 18px;
  }
  .suggest-questions li { margin-bottom: 2px; }

  /* ── Table ── */
  .db-table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; }
  thead th {
    padding: 10px 16px;
    text-align: left;
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: .12em;
    color: var(--text-3);
    background: var(--surface-2);
    border-bottom: 1px solid var(--border);
  }
  thead th:first-child { border-radius: var(--radius-sm) 0 0 var(--radius-sm); }
  thead th:last-child  { border-radius: 0 var(--radius-sm) var(--radius-sm) 0; }
  tbody tr { border-bottom: 1px solid var(--border); transition: background .15s; }
  tbody tr:last-child { border-bottom: none; }
  tbody tr:hover { background: var(--surface-2); }
  td { padding: 13px 16px; font-size: 13.5px; }

  .mode-badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .05em;
    text-transform: uppercase;
    background: var(--accent-soft);
    color: var(--accent);
  }
  .status-complete {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .05em;
    text-transform: uppercase;
    background: #dcfce7;
    color: #16a34a;
  }
  .status-active {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 100px;
    font-size: 10px;
    font-weight: 700;
    letter-spacing: .05em;
    text-transform: uppercase;
    background: #fef9c3;
    color: #ca8a04;
  }
  .view-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    font-weight: 600;
    color: var(--accent);
    background: var(--accent-soft);
    padding: 4px 10px;
    border-radius: 100px;
    border: none;
    cursor: pointer;
    transition: background .15s;
    font-family: var(--font-body);
    text-decoration: none;
  }
  .view-link:hover { background: #f9d0bc; }

  .score-val {
    font-family: var(--font-display);
    font-size: 15px;
    font-weight: 700;
    color: var(--accent-2);
  }

  /* ── Empty state ── */
  .empty-state {
    text-align: center;
    padding: 56px 24px;
    color: var(--text-3);
  }
  .empty-icon {
    width: 56px; height: 56px;
    margin: 0 auto 16px;
    background: var(--surface-2);
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    color: var(--text-3);
  }
  .empty-title { font-family: var(--font-display); font-size: 1rem; font-weight: 700; color: var(--text-2); margin-bottom: 6px; }
  .empty-sub { font-size: 13px; }

  /* ── Loading ── */
  .db-loading {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 16px;
    background: var(--bg);
    font-family: var(--font-body);
  }
  .loader {
    width: 40px; height: 40px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loader-text { font-size: 14px; color: var(--text-3); font-weight: 500; }

  /* ── Fade-in ── */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .db-root > * {
    animation: fadeUp .4s ease both;
  }
  .db-root > *:nth-child(1) { animation-delay: .05s; }
  .db-root > *:nth-child(2) { animation-delay: .10s; }
  .db-root > *:nth-child(3) { animation-delay: .15s; }
  .db-root > *:nth-child(4) { animation-delay: .20s; }
  .db-root > *:nth-child(5) { animation-delay: .25s; }
  .db-root > *:nth-child(6) { animation-delay: .30s; }
  .db-root > *:nth-child(7) { animation-delay: .35s; }
`;

const PIE_COLORS = ["#d4622a", "#2a6dd4", "#22a67a", "#a855f7", "#f59e0b"];

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="custom-tip">
        <div style={{ fontWeight: 700, marginBottom: 2 }}>{label}</div>
        {payload.map((p, i) => (
          <div key={i} style={{ color: p.color }}>
            {p.name}: <strong>{p.value}</strong>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [sessions, setSessions] = useState([]);
  const [progress, setProgress] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMode, setSelectedMode] = useState("DSA");
  const [difficulty, setDifficulty] = useState(3);
  const [creating, setCreating] = useState(false);
  const [suggestion, setSuggestion] = useState(null);

  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    showPreferencesModal,
    setShowModal,
    initPreferences,
    preferences,
    fetchPreferences,
  } = useProfileStore();
  const initDoneRef = useRef(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (initDoneRef.current) return;
    initDoneRef.current = true;
    initPreferences();
    fetchPreferences();
  }, [initPreferences, fetchPreferences]);

  const loadData = async () => {
    try {
      const [sessionsData, progressData, cardsData, suggestedData] =
        await Promise.all([
          sessionService.listSessions(20),
          analyticsService.getProgress(20),
          sessionService.getInterviewCards().catch(() => ({ cards: [] })),
          api
            .get("/profile/suggested-interview")
            .then((res) => res.data)
            .catch(() => null),
        ]);
      const loadedSessions = sessionsData?.sessions || [];
      setSessions(loadedSessions);
      setProgress(progressData);
      setCards(cardsData?.cards || []);
      setSuggestion(suggestedData);
      if (
        loadedSessions.length > 0 &&
        !loadedSessions.find((s) => s.mode === selectedMode)
      ) {
        setSelectedMode(loadedSessions[0].mode);
      }
    } catch (err) {
      console.error("Failed to load data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!suggestion) return;
    if (suggestion.mode) {
      setSelectedMode(suggestion.mode);
    }
    if (suggestion.difficulty) {
      setDifficulty(suggestion.difficulty);
    }
  }, [suggestion]);

  const handleStartInterview = async () => {
    setCreating(true);
    try {
      const session = await sessionService.createSession(
        selectedMode,
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

  const handleViewQuestions = (sessionId) => {
    navigate(`/session/${sessionId}/qa-summary`);
  };

  const modeCounts = useMemo(() => {
    const counts = sessions.reduce((acc, s) => {
      acc[s.mode] = (acc[s.mode] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([mode, count]) => ({ mode, count }));
  }, [sessions]);

  const scoreTrend = useMemo(() => {
    return sessions
      .slice()
      .reverse()
      .map((s, idx) => ({
        label: `S${idx + 1}`,
        score: s.total_score != null ? Number(s.total_score) : 3,
      }));
  }, [sessions]);

  const topMode = useMemo(() => {
    if (!modeCounts.length) return "N/A";
    return modeCounts.slice().sort((a, b) => b.count - a.count)[0].mode;
  }, [modeCounts]);

  const averageScore = useMemo(() => {
    if (!sessions.length) return null;
    const totalScore = sessions.reduce((sum, s) => {
      // Use actual score if available, otherwise use 3 as default
      return sum + (s.total_score != null ? Number(s.total_score) : 3);
    }, 0);
    return totalScore / sessions.length;
  }, [sessions]);

  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

  if (loading) {
    return (
      <>
        <style>{STYLE}</style>
        <div className="db-loading">
          <div className="loader" />
          <p className="loader-text">Loading your dashboard…</p>
        </div>
      </>
    );
  }

  const interviewOptions = cards.length
    ? cards
    : [
        { mode: "DSA", title: "Data Structures & Algorithms" },
        { mode: "HR", title: "HR Interview" },
        { mode: "BEHAVIORAL", title: "Behavioral" },
        { mode: "SYSTEM_DESIGN", title: "System Design" },
      ];

  const diffLabels = {
    1: "Easy",
    2: "Easy+",
    3: "Medium",
    4: "Hard",
    5: "Expert",
  };

  return (
    <>
      <style>{STYLE}</style>
      <div className="db-root">
        {/* ── Header ── */}
        <div className="db-header">
          <div>
            <h1 className="db-title">Interviewbit</h1>
            <p className="db-subtitle">
              Track your progress and sharpen your skills
            </p>
          </div>
          <div className="db-header-date">{today}</div>
        </div>

        {/* ── Stat Cards ── */}
        <div className="db-stats">
          <div
            className="stat-card"
            style={{
              "--stripe": "#d4622a",
              "--icon-bg": "#fde8dc",
              "--icon-color": "#d4622a",
            }}
          >
            <div className="stat-icon">
              <BarChart3 size={16} />
            </div>
            <div className="stat-label">Total Sessions</div>
            <div className="stat-value">
              {progress?.total_sessions || sessions.length || 0}
            </div>
          </div>

          <div
            className="stat-card"
            style={{
              "--stripe": "#2a6dd4",
              "--icon-bg": "#dbeafe",
              "--icon-color": "#2a6dd4",
            }}
          >
            <div className="stat-icon">
              <TrendingUp size={16} />
            </div>
            <div className="stat-label">Average Score</div>
            <div className="stat-value">
              {averageScore !== null ? averageScore.toFixed(1) : "—"}
            </div>
          </div>

          <div
            className="stat-card"
            style={{
              "--stripe": "#22a67a",
              "--icon-bg": "#d1fae5",
              "--icon-color": "#22a67a",
            }}
          >
            <div className="stat-icon">
              <Zap size={16} />
            </div>
            <div className="stat-label">Interview Tracks</div>
            <div className="stat-value">{cards.length || 4}</div>
          </div>

          <div
            className="stat-card"
            style={{
              "--stripe": "#a855f7",
              "--icon-bg": "#f3e8ff",
              "--icon-color": "#a855f7",
            }}
          >
            <div className="stat-icon">
              <Award size={16} />
            </div>
            <div className="stat-label">Top Interview Type</div>
            <div className={`stat-value ${topMode.length > 5 ? "sm" : ""}`}>
              {topMode}
            </div>
          </div>
        </div>

        {/* ── Profile + Bar Chart ── */}
        <div className="db-grid-3">
          <div className="db-card">
            <div className="section-head">
              <User size={16} />
              <span className="section-title">Profile Snapshot</span>
            </div>
            <div className="profile-row">
              <div className="profile-field">
                <div className="pf-label">Email</div>
                <div className="pf-value">{user?.email || "N/A"}</div>
              </div>
              <div className="profile-field">
                <div className="pf-label">Experience Level</div>
                {preferences?.experience_level ? (
                  <span
                    className="tag accent"
                    style={{ textTransform: "capitalize" }}
                  >
                    {preferences.experience_level}
                  </span>
                ) : (
                  <div className="pf-value" style={{ color: "var(--text-3)" }}>
                    Not set
                  </div>
                )}
              </div>
              <div className="profile-field">
                <div className="pf-label">Preferred Roles</div>
                {preferences?.preferred_roles?.length ? (
                  <div className="tag-list">
                    {preferences.preferred_roles.map((r) => (
                      <span key={r} className="tag">
                        {r}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="pf-value" style={{ color: "var(--text-3)" }}>
                    Not set
                  </div>
                )}
              </div>
              <div className="profile-field">
                <div className="pf-label">Preferred Modes</div>
                {preferences?.preferred_interview_modes?.length ? (
                  <div className="tag-list">
                    {preferences.preferred_interview_modes.map((m) => (
                      <span key={m} className="tag accent">
                        {m}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="pf-value" style={{ color: "var(--text-3)" }}>
                    Not set
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="db-card">
            <div className="section-head">
              <BarChart3 size={16} />
              <span className="section-title">Interview Type Distribution</span>
            </div>
            {modeCounts.length ? (
              <ResponsiveContainer width="100%" height={270}>
                <BarChart data={modeCounts} barSize={32}>
                  <CartesianGrid
                    strokeDasharray="2 4"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="mode"
                    tick={{
                      fontFamily: "DM Sans",
                      fontSize: 12,
                      fill: "var(--text-2)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    allowDecimals={false}
                    tick={{
                      fontFamily: "DM Sans",
                      fontSize: 11,
                      fill: "var(--text-3)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="count"
                    fill="var(--accent)"
                    radius={[6, 6, 0, 0]}
                  >
                    {modeCounts.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <BarChart3 size={22} />
                </div>
                <div className="empty-title">No data yet</div>
                <div className="empty-sub">
                  Start an interview to see your distribution
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Score Trend + Pie ── */}
        <div className="db-grid-2">
          <div className="db-card">
            <div className="section-head">
              <TrendingUp size={16} />
              <span className="section-title">Score Trend</span>
            </div>
            {scoreTrend.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={scoreTrend}>
                  <CartesianGrid
                    strokeDasharray="2 4"
                    stroke="var(--border)"
                    vertical={false}
                  />
                  <XAxis
                    dataKey="label"
                    tick={{
                      fontFamily: "DM Sans",
                      fontSize: 12,
                      fill: "var(--text-2)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    domain={[0, 5]}
                    tick={{
                      fontFamily: "DM Sans",
                      fontSize: 11,
                      fill: "var(--text-3)",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="#2a6dd4"
                    strokeWidth={2.5}
                    dot={{
                      r: 4,
                      fill: "#2a6dd4",
                      strokeWidth: 2,
                      stroke: "#fff",
                    }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <TrendingUp size={22} />
                </div>
                <div className="empty-title">No scores yet</div>
                <div className="empty-sub">
                  Complete interviews to see your progress
                </div>
              </div>
            )}
          </div>

          <div className="db-card">
            <div className="section-head">
              <Target size={16} />
              <span className="section-title">Mode Share</span>
            </div>
            {modeCounts.length ? (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie
                    data={modeCounts}
                    dataKey="count"
                    nameKey="mode"
                    outerRadius={95}
                    innerRadius={50}
                    paddingAngle={3}
                    label={({ mode, percent }) =>
                      `${mode} ${(percent * 100).toFixed(0)}%`
                    }
                    labelLine={false}
                  >
                    {modeCounts.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">
                  <Target size={22} />
                </div>
                <div className="empty-title">No interviews yet</div>
                <div className="empty-sub">
                  Your mode breakdown will appear here
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Start Interview ── */}
        <div className="db-card start-card">
          <div className="section-head">
            <Zap size={16} />
            <span className="section-title">Start New Interview</span>
          </div>
          {suggestion && (
            <div className="suggest-row">
              <div className="suggest-label">AI Suggested Track</div>
              <div className="suggest-main">
                <span className="suggest-title">
                  {suggestion.title || suggestion.mode}
                </span>
                <span className="suggest-pill">
                  {suggestion.mode} •{" "}
                  {diffLabels[suggestion.difficulty] || "Custom"}
                </span>
                <button
                  type="button"
                  className="suggest-apply"
                  onClick={() => {
                    if (suggestion.mode) setSelectedMode(suggestion.mode);
                    if (suggestion.difficulty)
                      setDifficulty(suggestion.difficulty);
                  }}
                >
                  Use this setup
                </button>
              </div>
              {suggestion.sample_questions?.length ? (
                <div className="suggest-questions">
                  Sample questions you might see:
                  <ul>
                    {suggestion.sample_questions.slice(0, 3).map((q, idx) => (
                      <li key={idx}>{q}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          )}
          <div className="start-grid">
            <div>
              <label className="form-label">Interview Type</label>
              <select
                value={selectedMode}
                onChange={(e) => setSelectedMode(e.target.value)}
                className="start-select"
              >
                {interviewOptions.map((c) => (
                  <option
                    key={c.id || c.key || c.mode}
                    value={c.mode || c.key || c.id}
                  >
                    {c.title || c.mode || c.key || c.id}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="form-label">Difficulty</label>
              <div className="diff-row">
                <span
                  style={{
                    fontSize: 13,
                    color: "rgba(255,255,255,.55)",
                    fontWeight: 500,
                  }}
                >
                  Starting level
                </span>
                <span className="diff-value">{diffLabels[difficulty]}</span>
              </div>
              <input
                type="range"
                min="1"
                max="5"
                value={difficulty}
                onChange={(e) => setDifficulty(Number(e.target.value))}
              />
              <div className="diff-labels">
                <span>Easy</span>
                <span>Medium</span>
                <span>Hard</span>
              </div>
            </div>
          </div>
          <button
            onClick={handleStartInterview}
            disabled={creating}
            className="start-btn"
          >
            <Play size={14} />
            {creating ? "Starting…" : "Start Interview"}
          </button>
        </div>

        {/* ── Recent Sessions ── */}
        <div className="db-card">
          <div className="section-head">
            <Clock size={16} />
            <span className="section-title">Recent Sessions</span>
          </div>
          {sessions.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                <Clock size={22} />
              </div>
              <div className="empty-title">No sessions yet</div>
              <div className="empty-sub">
                Start your first interview above to get going
              </div>
            </div>
          ) : (
            <div className="db-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Mode</th>
                    <th>Date</th>
                    <th>Questions</th>
                    <th>Score</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => (
                    <tr key={session.id}>
                      <td>
                        <span className="mode-badge">{session.mode}</span>
                      </td>
                      <td style={{ color: "var(--text-2)", fontSize: 13 }}>
                        {new Date(session.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ color: "var(--text-2)", fontSize: 13 }}>
                        {session.questions_count}
                      </td>
                      <td>
                        {session.total_score !== null &&
                        session.total_score !== undefined &&
                        session.total_score !== "" ? (
                          <span className="score-val">
                            {Number(session.total_score).toFixed(1)}
                          </span>
                        ) : (
                          <span className="score-val" style={{ opacity: 0.6 }}>
                            3.0
                          </span>
                        )}
                      </td>
                      <td>
                        <span
                          className={
                            session.state === "COMPLETE"
                              ? "status-complete"
                              : "status-active"
                          }
                        >
                          {session.state}
                        </span>
                      </td>
                      <td>
                        <div
                          style={{
                            display: "flex",
                            gap: "8px",
                            alignItems: "center",
                          }}
                        >
                          {session.state === "COMPLETE" && (
                            <>
                              <button
                                className="view-link"
                                onClick={() => handleViewQuestions(session.id)}
                              >
                                Q&A <ChevronRight size={12} />
                              </button>
                              <button
                                className="view-link"
                                onClick={() =>
                                  navigate(`/session/${session.id}/summary`)
                                }
                              >
                                Summary <ChevronRight size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <PreferencesModal
        isOpen={showPreferencesModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
}
