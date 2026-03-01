import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sessionService } from '../services/sessionService'
import { TrendingUp, Award, Target, ArrowRight, CheckCircle, Clock, BarChart } from 'lucide-react'
import ThemeToggle from '../components/ThemeToggle'

const STYLES = `
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
    --amber:       #f59e0b;
    --amber-soft:  rgba(245, 158, 11, 0.15);
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
    --blue-soft:   rgba(59, 130, 246, 0.1);
    --amber-soft:  #fef3c7;
    --shadow-sm:   0 1px 3px rgba(26,23,20,.06), 0 1px 2px rgba(26,23,20,.04);
    --shadow-md:   0 4px 16px rgba(26,23,20,.08), 0 2px 6px rgba(26,23,20,.04);
  }

  .summary-root {
    background: var(--bg);
    min-height: 100vh;
    padding: 36px 24px 80px;
    font-family: var(--font-body);
    color: var(--text-1);
    transition: background 0.3s ease, color 0.3s ease;
  }

  .summary-container {
    max-width: 1000px;
    margin: 0 auto;
    position: relative;
  }

  .theme-toggle-container {
    position: absolute;
    top: -12px;
    right: 0;
  }

  .summary-header {
    text-align: center;
    margin-bottom: 48px;
    animation: fadeUp 0.8s cubic-bezier(0.23, 1, 0.32, 1);
  }

  .summary-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
    background: linear-gradient(135deg, var(--green), var(--blue));
    border-radius: 20px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    box-shadow: 0 8px 32px rgba(16, 185, 129, 0.3);
    animation: scaleIn 0.8s cubic-bezier(0.23, 1, 0.32, 1) 0.3s both;
  }

  .summary-title {
    font-family: var(--font-display);
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 12px;
    background: linear-gradient(135deg, var(--text-1), var(--green));
    background-clip: text;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }

  .summary-subtitle {
    font-size: 1.1rem;
    color: var(--text-2);
    font-weight: 500;
  }

  .summary-card {
    background: var(--surface);
    border: 1px solid var(--border);
    border-radius: 20px;
    padding: 32px;
    margin-bottom: 24px;
    box-shadow: var(--shadow-md);
    backdrop-filter: blur(20px);
    position: relative;
    animation: fadeUp 0.8s cubic-bezier(0.23, 1, 0.32, 1) 0.2s both;
  }

  .summary-card::before {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    bottom: -1px;
    background: linear-gradient(135deg, var(--green), var(--blue), var(--purple));
    border-radius: 20px;
    z-index: -1;
    opacity: 0.2;
  }

  .score-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
  }

  .score-card {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
    text-align: center;
    position: relative;
    transition: all 0.3s ease;
  }

  .score-card:hover {
    transform: translateY(-2px);
    box-shadow: var(--shadow-md);
  }

  .score-card.excellent {
    background: var(--green-soft);
    border-color: var(--green);
  }

  .score-card.good {
    background: var(--blue-soft);
    border-color: var(--blue);
  }

  .score-card.needs-work {
    background: var(--amber-soft);
    border-color: var(--amber);
  }

  .score-value {
    font-family: var(--font-display);
    font-size: 2.5rem;
    font-weight: 800;
    margin-bottom: 8px;
  }

  .score-card.excellent .score-value {
    color: var(--green);
  }

  .score-card.good .score-value {
    color: var(--blue);
  }

  .score-card.needs-work .score-value {
    color: var(--amber);
  }

  .score-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-2);
    text-transform: uppercase;
    letter-spacing: 0.1em;
  }

  .feedback-section {
    margin: 32px 0;
  }

  .section-title {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-1);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .feedback-item {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 12px;
  }

  .feedback-item h4 {
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 600;
    color: var(--text-1);
    margin-bottom: 8px;
  }

  .feedback-item p {
    color: var(--text-2);
    line-height: 1.6;
    font-size: 14px;
  }

  .suggestions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    margin-top: 16px;
  }

  .suggestion-card {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 20px;
    transition: all 0.3s ease;
    position: relative;
  }

  .suggestion-card:hover {
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  .suggestion-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--purple), var(--blue));
    border-radius: 12px 12px 0 0;
  }

  .suggestion-card h5 {
    font-family: var(--font-display);
    font-weight: 600;
    color: var(--text-1);
    margin-bottom: 8px;
  }

  .suggestion-card p {
    color: var(--text-2);
    font-size: 14px;
    line-height: 1.5;
  }

  .action-buttons {
    display: flex;
    gap: 16px;
    justify-content: center;
    margin-top: 48px;
    flex-wrap: wrap;
  }

  .btn-primary {
    background: linear-gradient(135deg, var(--accent), #e55a2b);
    border: none;
    border-radius: 12px;
    padding: 16px 24px;
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 600;
    color: white;
    cursor: pointer;
    transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
    display: flex;
    align-items: center;
    gap: 8px;
    position: relative;
    overflow: hidden;
  }

  .btn-primary::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }

  .btn-primary:hover::before {
    left: 100%;
  }

  .btn-primary:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 32px rgba(255, 107, 53, 0.4);
  }

  .btn-secondary {
    background: var(--surface-2);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 16px 24px;
    font-family: var(--font-display);
    font-size: 16px;
    font-weight: 600;
    color: var(--text-2);
    cursor: pointer;
    transition: all 0.3s ease;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .btn-secondary:hover {
    background: var(--surface);
    color: var(--text-1);
    transform: translateY(-1px);
  }

  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 60vh;
    gap: 20px;
  }

  .loader {
    width: 48px;
    height: 48px;
    border: 3px solid var(--border);
    border-top: 3px solid var(--accent);
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .empty-state {
    text-align: center;
    padding: 60px 20px;
  }

  .empty-icon {
    width: 80px;
    height: 80px;
    margin: 0 auto 24px;
    background: var(--surface-2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-3);
  }

  .empty-title {
    font-family: var(--font-display);
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--text-1);
    margin-bottom: 12px;
  }

  .empty-subtitle {
    color: var(--text-3);
    margin-bottom: 32px;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  @keyframes scaleIn {
    from { opacity: 0; transform: scale(0.8); }
    to { opacity: 1; transform: scale(1); }
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  @media (max-width: 640px) {
    .summary-root {
      padding: 24px 16px 60px;
    }

    .summary-card {
      padding: 24px;
    }

    .score-grid {
      grid-template-columns: 1fr;
    }

    .suggestions-grid {
      grid-template-columns: 1fr;
    }

    .action-buttons {
      flex-direction: column;
    }

    .summary-title {
      font-size: 2rem;
    }
  }
`;

export default function SessionSummary() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  const [summary, setSummary] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadSummary()
  }, [sessionId])

  const loadSummary = async () => {
    try {
      const data = await sessionService.getSummary(sessionId)
      setSummary(data)
    } catch (error) {
      console.error('Failed to load summary:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreCategory = (score) => {
    if (score >= 80) return 'excellent'
    if (score >= 60) return 'good'
    return 'needs-work'
  }

  if (loading) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="summary-root">
          <div className="loading-container">
            <div className="loader"></div>
            <p style={{ color: 'var(--text-2)' }}>Loading session summary...</p>
          </div>
        </div>
      </>
    )
  }

  if (!summary) {
    return (
      <>
        <style>{STYLES}</style>
        <div className="summary-root">
          <div className="summary-container">
            <div className="theme-toggle-container">
              <ThemeToggle />
            </div>
            <div className="summary-card">
              <div className="empty-state">
                <div className="empty-icon">
                  <BarChart size={32} />
                </div>
                <h2 className="empty-title">Summary Not Available</h2>
                <p className="empty-subtitle">
                  We couldn't find the session summary you're looking for.
                </p>
                <button 
                  onClick={() => navigate('/dashboard')} 
                  className="btn-primary"
                >
                  <ArrowRight size={18} />
                  Back to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <style>{STYLES}</style>
      <div className="summary-root">
        <div className="summary-container">
          <div className="theme-toggle-container">
            <ThemeToggle />
          </div>

          <div className="summary-header">
            <div className="summary-icon">
              <Award size={40} />
            </div>
            <h1 className="summary-title">Session Complete!</h1>
            <p className="summary-subtitle">Here's how you performed in your interview session</p>
          </div>

          <div className="summary-card">
            <div className="score-grid">
              <div className={`score-card ${getScoreCategory(summary.overall_score)}`}>
                <div className="score-value">{summary.overall_score}%</div>
                <div className="score-label">Overall Score</div>
              </div>
              <div className={`score-card ${getScoreCategory(summary.technical_score)}`}>
                <div className="score-value">{summary.technical_score}%</div>
                <div className="score-label">Technical Skills</div>
              </div>
              <div className={`score-card ${getScoreCategory(summary.communication_score)}`}>
                <div className="score-value">{summary.communication_score}%</div>
                <div className="score-label">Communication</div>
              </div>
              <div className="score-card">
                <div className="score-value" style={{ color: 'var(--text-1)', fontSize: '1.5rem' }}>
                  {summary.duration || '00:00'}
                </div>
                <div className="score-label">Duration</div>
              </div>
            </div>

            {summary.feedback && summary.feedback.length > 0 && (
              <div className="feedback-section">
                <h3 className="section-title">
                  <Target size={20} />
                  Detailed Feedback
                </h3>
                {summary.feedback.map((item, index) => (
                  <div key={index} className="feedback-item">
                    <h4>{item.category}</h4>
                    <p>{item.comment}</p>
                  </div>
                ))}
              </div>
            )}

            {summary.suggestions && summary.suggestions.length > 0 && (
              <div className="feedback-section">
                <h3 className="section-title">
                  <TrendingUp size={20} />
                  Improvement Suggestions
                </h3>
                <div className="suggestions-grid">
                  {summary.suggestions.map((suggestion, index) => (
                    <div key={index} className="suggestion-card">
                      <h5>{suggestion.title}</h5>
                      <p>{suggestion.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="action-buttons">
              <button 
                onClick={() => navigate('/interview')} 
                className="btn-primary"
              >
                Start New Interview
                <ArrowRight size={18} />
              </button>
              <button 
                onClick={() => navigate('/analytics')} 
                className="btn-secondary"
              >
                <BarChart size={18} />
                View Analytics
              </button>
              <button 
                onClick={() => navigate('/dashboard')} 
                className="btn-secondary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}