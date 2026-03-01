import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sessionService } from '../services/sessionService'
import { TrendingUp, Award, Target, ArrowRight } from 'lucide-react'

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!summary) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="card text-center">
          <p className="text-gray-600">Summary not available</p>
          <button onClick={() => navigate('/dashboard')} className="btn-primary mt-4">
            Back to Dashboard
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Session Complete!</h1>
        <p className="text-gray-600">Here's how you performed</p>
      </div>

      {/* Overall Score */}
      <div className="card mb-8 text-center">
        <div className="flex items-center justify-center space-x-8">
          <div>
            <p className="text-gray-600 mb-2">Overall Score</p>
            <p className="text-6xl font-bold text-primary-600">
              {summary.total_score?.toFixed(1) || 'N/A'}
            </p>
            <p className="text-gray-500 mt-2">out of 5.0</p>
          </div>
          
          <div className="border-l border-gray-200 pl-8">
            <div className="text-left space-y-2">
              <div className="flex items-center space-x-2">
                <Award className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">{summary.questions_count} Questions</span>
              </div>
              <div className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">
                  Difficulty: {summary.difficulty_progression?.start} → {summary.difficulty_progression?.end}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-gray-600" />
                <span className="text-gray-700">{summary.mode} Interview</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dimension Scores */}
      {summary.dimension_averages && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4">Performance by Dimension</h2>
          <div className="space-y-3">
            {Object.entries(summary.dimension_averages).map(([dim, score]) => (
              <div key={dim}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 capitalize">
                    {dim.replace('_', ' ')}
                  </span>
                  <span className="font-semibold">{score.toFixed(1)}/5.0</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${(score / 5) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strengths and Improvements */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-green-800">
            Key Strengths
          </h2>
          <ul className="space-y-3">
            {summary.strengths?.map((strength, i) => (
              <li key={i} className="flex items-start text-gray-700">
                <span className="text-green-600 mr-2 mt-1">✓</span>
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-amber-800">
            Areas to Improve
          </h2>
          <ul className="space-y-3">
            {summary.improvements?.map((improvement, i) => (
              <li key={i} className="flex items-start text-gray-700">
                <span className="text-amber-600 mr-2 mt-1">→</span>
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Action Plan */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Recommended Next Steps</h2>
        <div className="space-y-3">
          {summary.action_plan?.map((action, i) => (
            <div key={i} className="flex items-start">
              <ArrowRight className="w-5 h-5 text-primary-600 mr-3 mt-0.5 flex-shrink-0" />
              <p className="text-gray-700">{action}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => navigate('/dashboard')}
          className="btn-primary"
        >
          Back to Dashboard
        </button>
        <button
          onClick={() => navigate('/analytics')}
          className="btn-secondary"
        >
          View Analytics
        </button>
      </div>
    </div>
  )
}
