import { useState } from 'react'
import api from '../services/api'

export default function Preparation() {
  const [topicsInput, setTopicsInput] = useState('arrays, system design, behavioral communication')
  const [loading, setLoading] = useState(false)
  const [plan, setPlan] = useState(null)
  const [error, setError] = useState('')

  const generatePlan = async () => {
    const topics = topicsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)

    if (!topics.length) {
      setError('Please enter at least one topic')
      return
    }

    setLoading(true)
    setError('')
    try {
      const response = await api.post('/profile/preparation/plan', { topics })
      setPlan(response.data.plan)
    } catch (e) {
      console.error('Failed to generate preparation plan:', e)
      setError(e.response?.data?.detail || 'Failed to generate plan')
      setPlan(null)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-5xl">
      <h1 className="text-3xl font-bold mb-2">Preparation</h1>
      <p className="text-gray-600 mb-6">
        Enter topics, and AI will generate a personalized learning roadmap.
      </p>

      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Topics (comma separated)</label>
        <textarea
          value={topicsInput}
          onChange={(e) => setTopicsInput(e.target.value)}
          className="input min-h-[120px]"
          placeholder="e.g. dynamic programming, distributed systems, conflict resolution"
        />
        <button onClick={generatePlan} disabled={loading} className="btn-primary mt-4">
          {loading ? 'Generating...' : 'Generate Learning Plan'}
        </button>
        {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
      </div>

      {plan?.sections?.length > 0 && (
        <div className="grid md:grid-cols-2 gap-6">
          {plan.sections.map((section, idx) => (
            <div key={`${section.title}-${idx}`} className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-lg font-semibold mb-3">{section.title}</h2>

              <p className="text-sm font-medium text-gray-700 mb-2">Tasks</p>
              <ul className="space-y-2 text-sm text-gray-700 mb-4">
                {(section.tasks || []).map((task, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-primary-600">•</span>
                    <span>{task}</span>
                  </li>
                ))}
              </ul>

              <p className="text-sm font-medium text-gray-700 mb-2">Outcomes</p>
              <ul className="space-y-2 text-sm text-gray-700">
                {(section.outcomes || []).map((outcome, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-600">✓</span>
                    <span>{outcome}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
