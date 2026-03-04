import { useState, useEffect } from "react";
import { analyticsService } from "../services/analyticsService";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  BarChart3,
  CheckCircle2,
  ArrowRight,
  Target,
  Sparkles,
} from "lucide-react";

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
    --amber:       #f59e0b;
    --amber-soft:  rgba(245, 158, 11, 0.15);
    --blue:        #3b82f6;
    --blue-soft:   rgba(59, 130, 246, 0.15);
    --red:         #ef4444;
    --red-soft:    rgba(239, 68, 68, 0.15);
    --shadow-sm:   0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2);
    --shadow-md:   0 4px 16px rgba(0, 0, 0, 0.4), 0 2px 6px rgba(0, 0, 0, 0.2);
    --radius:      14px;
    --radius-sm:   8px;
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
    --amber-soft:  #fef3c7;
    --blue-soft:   #dbeafe;
    --red-soft:    #fee2e2;
    --shadow-sm:   0 1px 3px rgba(26,23,20,.06), 0 1px 2px rgba(26,23,20,.04);
    --shadow-md:   0 4px 16px rgba(26,23,20,.08), 0 2px 6px rgba(26,23,20,.04);
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .an-root {
    max-width: 1100px;
    margin: 0 auto;
    padding: 36px 24px 80px;
    font-family: var(--font-body);
    color: var(--text-1);
    background: var(--bg);
    min-height: 100vh;
    transition: background 0.3s ease, color 0.3s ease;
  }

  /* Loading */
  .an-loading {
    min-height: 60vh;
    display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 14px;
  }
  .an-loader {
    width: 44px; height: 44px;
    border: 3px solid var(--border);
    border-top-color: var(--accent);
    border-radius: 50%;
    animation: spin .7s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }

  /* Header */
  .an-header {
    display: flex;
    align-items: flex-end;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 36px;
    flex-wrap: wrap;
  }

  .an-header-content {
    display: flex;
    align-items: flex-end;
    gap: 24px;
    flex-wrap: wrap;
    flex: 1;
    justify-content: space-between;
  }
  .an-title {
    font-family: var(--font-display);
    font-size: clamp(2rem, 4vw, 2.8rem);
    font-weight: 800;
    letter-spacing: -.04em;
    line-height: 1;
  }
  .an-title span { color: var(--accent); }
  .an-subtitle { font-size: 14px; color: var(--text-3); margin-top: 6px; font-weight: 300; }

  .an-period-select {
    padding: 9px 14px;
    border-radius: var(--radius-sm);
    border: 1px solid var(--border);
    background: var(--surface);
    color: var(--text-1);
    font-family: var(--font-body);
    font-size: 13.5px;
    font-weight: 500;
    cursor: pointer;
    outline: none;
    box-shadow: var(--shadow-sm);
    transition: border-color .15s;
    appearance: none;
    padding-right: 32px;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23a09890' stroke-width='2.5'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 10px center;
  }
  .an-period-select:focus { border-color: var(--accent); }

  /* Stat cards */
  .an-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    margin-bottom: 28px;
  }
  .an-stat {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 22px 24px;
    box-shadow: var(--shadow-sm);
    position: relative;
    overflow: hidden;
    transition: box-shadow .2s, transform .2s;
  }
  .an-stat:hover { box-shadow: var(--shadow-md); transform: translateY(-2px); }
  .an-stat::after {
    content: '';
    position: absolute; top: 0; left: 0; right: 0;
    height: 3px;
    background: var(--stripe, var(--accent));
    border-radius: var(--radius) var(--radius) 0 0;
  }
  .an-stat-icon {
    width: 34px; height: 34px;
    border-radius: var(--radius-sm);
    background: var(--icon-bg, var(--accent-soft));
    color: var(--icon-color, var(--accent));
    display: flex; align-items: center; justify-content: center;
    margin-bottom: 14px;
  }
  .an-stat-label {
    font-size: 10.5px; font-weight: 700;
    text-transform: uppercase; letter-spacing: .12em;
    color: var(--text-3); margin-bottom: 6px;
  }
  .an-stat-value {
    font-family: var(--font-display);
    font-size: 2rem; font-weight: 800;
    letter-spacing: -.05em; line-height: 1;
    color: var(--text-1);
  }
  .an-stat-value.trend-improving { color: var(--green); }
  .an-stat-value.trend-declining { color: var(--red); }
  .an-stat-value.trend-stable { color: var(--blue); }

  .trend-badge {
    display: inline-flex; align-items: center; gap: 5px;
    margin-top: 8px;
    padding: 4px 10px;
    border-radius: 100px;
    font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .07em;
  }
  .trend-badge.improving { background: var(--green-soft); color: var(--green); }
  .trend-badge.declining { background: var(--red-soft); color: var(--red); }
  .trend-badge.stable    { background: var(--blue-soft); color: var(--blue); }

  /* Chart card */
  .an-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 24px 28px;
    box-shadow: var(--shadow-sm);
    margin-bottom: 20px;
    transition: box-shadow .2s;
  }
  .an-card:hover { box-shadow: var(--shadow-md); }

  .an-section-head {
    display: flex; align-items: center; gap: 10px;
    margin-bottom: 22px;
  }
  .an-section-head svg { color: var(--accent); }
  .an-section-title {
    font-family: var(--font-display);
    font-size: 1rem; font-weight: 700; letter-spacing: -.02em;
  }

  /* Custom tooltip */
  .an-tooltip {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 10px 14px;
    font-family: var(--font-body);
    font-size: 13px;
    box-shadow: var(--shadow-md);
    color: var(--text-1);
  }
  .an-tooltip-label { font-weight: 700; color: var(--text-2); margin-bottom: 4px; font-size: 11px; }
  .an-tooltip-val { font-family: var(--font-display); font-size: 1.3rem; font-weight: 800; color: var(--accent); }

  /* Feedback cards */
  .an-fb-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 18px;
    margin-bottom: 20px;
  }
  @media (max-width: 700px) { .an-fb-grid { grid-template-columns: 1fr; } }

  .an-fb-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 22px 24px;
    box-shadow: var(--shadow-sm);
  }
  .an-fb-title {
    font-family: var(--font-display);
    font-size: .95rem; font-weight: 700;
    display: flex; align-items: center; gap: 8px;
    margin-bottom: 16px;
  }
  .an-fb-title.green { color: var(--green); }
  .an-fb-title.amber { color: var(--amber); }

  .an-fb-item {
    display: flex; align-items: flex-start; gap: 8px;
    font-size: 13.5px; color: var(--text-2); line-height: 1.6;
    padding: 9px 0;
    border-bottom: 1px solid var(--border);
  }
  .an-fb-item:last-child { border-bottom: none; }
  .an-fb-item svg { flex-shrink: 0; margin-top: 3px; }
  .an-fb-item svg.green { color: var(--green); }
  .an-fb-item svg.amber { color: var(--amber); }

  .an-empty {
    padding: 24px 0;
    text-align: center;
    color: var(--text-3);
    font-size: 13.5px;
  }

  /* Focus areas */
  .an-focus-list { display: flex; flex-direction: column; gap: 10px; }
  .an-focus-item {
    display: flex; align-items: flex-start; gap: 12px;
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: var(--radius-sm);
    padding: 14px 16px;
    font-size: 13.5px;
    color: var(--text-2);
    line-height: 1.55;
    transition: background .15s;
  }
  .an-focus-item:hover { background: var(--accent-soft); border-color: rgba(212,98,42,.2); }
  .an-focus-num {
    font-family: var(--font-display);
    font-size: 12px; font-weight: 800;
    color: var(--accent);
    background: var(--accent-soft);
    width: 24px; height: 24px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .an-root > * {
    animation: fadeUp .35s ease both;
  }
  .an-root > *:nth-child(1) { animation-delay: .05s }
  .an-root > *:nth-child(2) { animation-delay: .10s }
  .an-root > *:nth-child(3) { animation-delay: .15s }
  .an-root > *:nth-child(4) { animation-delay: .20s }
  .an-root > *:nth-child(5) { animation-delay: .25s }
  .an-root > *:nth-child(6) { animation-delay: .30s }
`;

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="an-tooltip">
      <div className="an-tooltip-label">
        {new Date(label).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        })}
      </div>
      <div className="an-tooltip-val">
        {Number(payload[0].value).toFixed(2)}
      </div>
    </div>
  );
};

export default function Analytics() {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  useEffect(() => {
    loadInsights();
  }, [days]);

  const loadInsights = async () => {
    setLoading(true);
    try {
      const data = await analyticsService.getInsights(days);
      setInsights(data);
    } catch (err) {
      console.error("Failed to load insights:", err);
    } finally {
      setLoading(false);
    }
  };

  const trend = insights?.trend || "stable";
  const trendMeta = {
    improving: {
      label: "Improving",
      icon: <TrendingUp size={14} />,
      cls: "improving",
    },
    declining: {
      label: "Declining",
      icon: <TrendingDown size={14} />,
      cls: "declining",
    },
    stable: { label: "Stable", icon: <Minus size={14} />, cls: "stable" },
  }[trend] || { label: "Stable", icon: <Minus size={14} />, cls: "stable" };

  if (loading)
    return (
      <>
        <style>{STYLE}</style>
        <div className="an-root">
          <div className="an-loading">
            <div className="an-loader" />
            <p
              style={{
                fontSize: 14,
                color: "var(--text-3)",
                fontFamily: "var(--font-body)",
              }}
            >
              Loading analytics…
            </p>
          </div>
        </div>
      </>
    );

  return (
    <>
      <style>{STYLE}</style>
      <div className="an-root">
        {/* Header */}
        <div className="an-header">
          <div className="an-header-content">
            <div>
              <h1 className="an-title">
                Analytics<span>.</span>
              </h1>
              <p className="an-subtitle">Track your growth over time</p>
            </div>
            <select
              className="an-period-select"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
            >
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>

        {/* Stats */}
        <div className="an-stats">
          <div
            className="an-stat"
            style={{
              "--stripe": "#d4622a",
              "--icon-bg": "#fde8dc",
              "--icon-color": "#d4622a",
            }}
          >
            <div className="an-stat-icon">
              <BarChart3 size={15} />
            </div>
            <div className="an-stat-label">Total Sessions</div>
            <div className="an-stat-value">{insights?.total_sessions || 0}</div>
          </div>

          <div
            className="an-stat"
            style={{
              "--stripe":
                trend === "improving"
                  ? "#22a67a"
                  : trend === "declining"
                    ? "#dc2626"
                    : "#2a6dd4",
              "--icon-bg":
                trend === "improving"
                  ? "#d1fae5"
                  : trend === "declining"
                    ? "#fee2e2"
                    : "#dbeafe",
              "--icon-color":
                trend === "improving"
                  ? "#22a67a"
                  : trend === "declining"
                    ? "#dc2626"
                    : "#2a6dd4",
            }}
          >
            <div className="an-stat-icon">{trendMeta.icon}</div>
            <div className="an-stat-label">Performance Trend</div>
            <div
              className={`an-stat-value trend-${trendMeta.cls}`}
              style={{ fontSize: "1.3rem", textTransform: "capitalize" }}
            >
              <span className={`trend-badge ${trendMeta.cls}`}>
                {trendMeta.icon}
                {trendMeta.label}
              </span>
            </div>
          </div>

          <div
            className="an-stat"
            style={{
              "--stripe": "#a855f7",
              "--icon-bg": "#f3e8ff",
              "--icon-color": "#a855f7",
            }}
          >
            <div className="an-stat-icon">
              <Target size={15} />
            </div>
            <div className="an-stat-label">Focus Areas</div>
            <div className="an-stat-value">
              {insights?.recommended_focus?.length || 0}
            </div>
          </div>
        </div>

        {/* Score chart */}
        {insights?.scores_over_time?.length > 0 && (
          <div className="an-card">
            <div className="an-section-head">
              <TrendingUp size={16} />
              <span className="an-section-title">Score Progression</span>
            </div>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart
                data={insights.scores_over_time}
                margin={{ top: 6, right: 6, bottom: 0, left: -10 }}
              >
                <CartesianGrid
                  strokeDasharray="2 4"
                  stroke="var(--border)"
                  vertical={false}
                />
                <XAxis
                  dataKey="date"
                  tick={{
                    fontFamily: "DM Sans",
                    fontSize: 12,
                    fill: "var(--text-3)",
                  }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(d) =>
                    new Date(d).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  }
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
                <ReferenceLine
                  y={2.5}
                  stroke="var(--border)"
                  strokeDasharray="4 4"
                />
                <Tooltip content={<CustomTooltip />} />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="var(--accent)"
                  strokeWidth={2.5}
                  dot={{
                    r: 4,
                    fill: "var(--accent)",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Strengths + Improvements */}
        <div className="an-fb-grid">
          <div className="an-fb-card">
            <div className="an-fb-title green">
              <CheckCircle2 size={15} />
              Common Strengths
            </div>
            {insights?.common_strengths?.length ? (
              insights.common_strengths.map((s, i) => (
                <div key={i} className="an-fb-item">
                  <CheckCircle2 size={13} className="green" />
                  {s}
                </div>
              ))
            ) : (
              <div className="an-empty">
                Complete more sessions to see patterns
              </div>
            )}
          </div>

          <div className="an-fb-card">
            <div className="an-fb-title amber">
              <ArrowRight size={15} />
              Areas to Improve
            </div>
            {insights?.common_improvements?.length ? (
              insights.common_improvements.map((s, i) => (
                <div key={i} className="an-fb-item">
                  <ArrowRight size={13} className="amber" />
                  {s}
                </div>
              ))
            ) : (
              <div className="an-empty">
                Complete more sessions to see patterns
              </div>
            )}
          </div>
        </div>

        {/* Focus areas */}
        {insights?.recommended_focus?.length > 0 && (
          <div className="an-card">
            <div className="an-section-head">
              <Sparkles size={16} />
              <span className="an-section-title">Recommended Focus Areas</span>
            </div>
            <div className="an-focus-list">
              {insights.recommended_focus.map((focus, i) => (
                <div key={i} className="an-focus-item">
                  <span className="an-focus-num">{i + 1}</span>
                  {focus}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
