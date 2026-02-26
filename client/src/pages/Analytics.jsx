import { useState, useEffect } from 'react'
import { analyticsService } from '../services/analyticsService'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export default function Analytics() {
  const [insights, setInsights] = useState(null)
  const [loading, setLoading] = useState(true)
  const [days, setDays] = useState(30)

  useEffect(() => {
    loadInsights()
  }, [days])

  const loadInsights = async () => {
    setLoading(true)
    try {
      const data = await analyticsService.getInsights(days)
      setInsights(data)
    } catch (error) {
      console.error('Failed to load insights:', error)
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

  const getTrendIcon = () => {
    if (insights?.trend === 'improving') return <TrendingUp className="w-6 h-6 text-green-600" />
    if (insights?.trend === 'declining') return <TrendingDown className="w-6 h-6 text-red-600" />
    return <Minus className="w-6 h-6 text-gray-600" />
  }

  const getTrendColor = () => {
    if (insights?.trend === 'improving') return 'text-green-600'
    if (insights?.trend === 'declining') return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Analytics</h1>
        
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="input w-auto"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Overview Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <p className="text-gray-600 text-sm mb-2">Total Sessions</p>
          <p className="text-3xl font-bold">{insights?.total_sessions || 0}</p>
        </div>

        <div className="card">
          <p className="text-gray-600 text-sm mb-2">Performance Trend</p>
          <div className="flex items-center space-x-2">
            {getTrendIcon()}
            <p className={`text-2xl font-bold capitalize ${getTrendColor()}`}>
              {insights?.trend || 'stable'}
            </p>
          </div>
        </div>

        <div className="card">
          <p className="text-gray-600 text-sm mb-2">Focus Areas</p>
          <p className="text-lg font-semibold text-gray-800">
            {insights?.recommended_focus?.length || 0} identified
          </p>
        </div>
      </div>

      {/* Score Over Time Chart */}
      {insights?.scores_over_time && insights.scores_over_time.length > 0 && (
        <div className="card mb-8">
          <h2 className="text-xl font-semibold mb-4">Score Progression</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={insights.scores_over_time}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(date) => new Date(date).toLocaleDateString()}
              />
              <YAxis domain={[0, 5]} />
              <Tooltip
                labelFormatter={(date) => new Date(date).toLocaleDateString()}
                formatter={(value) => [value.toFixed(2), 'Score']}
              />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#0ea5e9"
                strokeWidth={2}
                dot={{ fill: '#0ea5e9' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Strengths and Improvements */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-green-800">
            Common Strengths
          </h2>
          {insights?.common_strengths && insights.common_strengths.length > 0 ? (
            <ul className="space-y-2">
              {insights.common_strengths.map((strength, i) => (
                <li key={i} className="flex items-start text-gray-700">
                  <span className="text-green-600 mr-2">✓</span>
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Complete more sessions to see patterns</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4 text-amber-800">
            Common Areas to Improve
          </h2>
          {insights?.common_improvements && insights.common_improvements.length > 0 ? (
            <ul className="space-y-2">
              {insights.common_improvements.map((improvement, i) => (
                <li key={i} className="flex items-start text-gray-700">
                  <span className="text-amber-600 mr-2">→</span>
                  <span>{improvement}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500">Complete more sessions to see patterns</p>
          )}
        </div>
      </div>

      {/* Recommended Focus */}
      {insights?.recommended_focus && insights.recommended_focus.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Recommended Focus Areas</h2>
          <div className="space-y-3">
            {insights.recommended_focus.map((focus, i) => (
              <div key={i} className="bg-primary-50 rounded-lg p-4">
                <p className="text-gray-800">{focus}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
