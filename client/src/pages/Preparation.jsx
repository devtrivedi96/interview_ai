import { useState } from 'react'
import api from '../services/api'
import { BookOpen, Sparkles, CheckCircle2, ArrowRight, AlertCircle } from 'lucide-react'

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
    --shadow-sm:   0 1px 3px rgba(26,23,20,.06), 0 1px 2px rgba(26,23,20,.04);
    --shadow-md:   0 4px 16px rgba(26,23,20,.08), 0 2px 6px rgba(26,23,20,.04);
    --radius:      14px;
    --radius-sm:   10px;
    --font-display: 'Syne', sans-serif;
    --font-body:    'DM Sans', sans-serif;
  }

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .pp-root {
    max-width: 1040px;
    padding: 36px 24px 80px;
    font-family: var(--font-body);
    color: var(--text-1);
  }

  /* Header */
  .pp-header { margin-bottom: 32px; }
  .pp-title {
    font-family: var(--font-display);
    font-size: clamp(2rem, 4vw, 2.8rem);
    font-weight: 800;
    letter-spacing: -.04em;
    line-height: 1;
  }
  .pp-title span { color: var(--accent); }
  .pp-subtitle { font-size: 14px; color: var(--text-3); margin-top: 7px; font-weight: 300; }

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
  }

  /* Section card */
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

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

  /* Stagger cards */
  .pp-section-card:nth-child(1) { animation-delay: .08s }
  .pp-section-card:nth-child(2) { animation-delay: .14s }
  .pp-section-card:nth-child(3) { animation-delay: .20s }
  .pp-section-card:nth-child(4) { animation-delay: .26s }
  .pp-section-card:nth-child(5) { animation-delay: .32s }
  .pp-section-card:nth-child(6) { animation-delay: .38s }
`

export default function Preparation() {
  const [topicsInput, setTopicsInput] = useState('arrays, system design, behavioral communication')
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState('')

  const generatePlan = async () => {
    const topics = topicsInput.split(',').map((t) => t.trim()).filter(Boolean)
    if (!topics.length) { setError('Please enter at least one topic.'); return }
    setLoading(true); setError('')
    try {
      const response = await api.post('/profile/preparation/plan', { topics })
      setPlan(response.data.plan)
    } catch (e) {
      setError(e.response?.data?.detail || 'Failed to generate plan. Please try again.')
      setPlan(null)
    } finally { setLoading(false) }
  }

  return (
    <>
      <style>{STYLE}</style>
      <div className="pp-root">

        {/* Header */}
        <div className="pp-header">
          <h1 className="pp-title">Preparation<span>.</span></h1>
          <p className="pp-subtitle">Enter topics and get a personalized AI learning roadmap.</p>
        </div>

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
            <span className="pp-hint">Each topic becomes a dedicated section in your plan.</span>
            <button className="pp-gen-btn" onClick={generatePlan} disabled={loading}>
              {loading
                ? <><div className="pp-spin" /> Generating…</>
                : <><Sparkles size={14} /> Generate Plan</>
              }
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
              <div key={`${section.title}-${idx}`} className="pp-section-card">
                <div className="pp-card-num">Section {idx + 1}</div>
                <div className="pp-card-title">{section.title}</div>

                {section.tasks?.length > 0 && (
                  <>
                    <div className="pp-list-label">
                      <ArrowRight size={11} style={{ color: 'var(--accent)' }} />
                      Tasks
                    </div>
                    <div className="pp-list">
                      {section.tasks.map((task, i) => (
                        <div key={i} className="pp-list-item">
                          <ArrowRight size={13} className="task" />
                          {task}
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {section.outcomes?.length > 0 && (
                  <>
                    <hr className="pp-card-divider" />
                    <div className="pp-list-label">
                      <CheckCircle2 size={11} style={{ color: 'var(--green)' }} />
                      Outcomes
                    </div>
                    <div className="pp-list">
                      {section.outcomes.map((outcome, i) => (
                        <div key={i} className="pp-list-item">
                          <CheckCircle2 size={13} className="outcome" />
                          {outcome}
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

      </div>
    </>
  )
}