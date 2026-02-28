import { useEffect, useState } from 'react'
import { analyticsService } from '../services/analyticsService'

export default function Suggestions() {
  const [loading, setLoading] = useState(true)
  const [focusAreas, setFocusAreas] = useState([])

  useEffect(() => {
    const loadSuggestions = async () => {
      try {
        const insights = await analyticsService.getInsights(30)
        const dynamicFocus = insights?.recommended_focus || []
        const defaults = [
          'Structure answers with clear beginning, middle, and end.',
          'State trade-offs explicitly when giving technical decisions.',
          'Quantify impact using metrics in behavioral responses.',
        ]
        setFocusAreas(dynamicFocus.length ? dynamicFocus : defaults)
      } catch (error) {
        console.error('Failed to load suggestions:', error)
        setFocusAreas([
          'Practice 3 mock questions daily with 2-minute answer limit.',
          'Record answers and review clarity and pacing.',
          'Revise one topic deeply before switching domains.',
        ])
      } finally {
        setLoading(false)
      }
    }

    loadSuggestions()
  }, [])

  return (
    <div className="max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Suggestions</h1>
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {loading ? (
          <p className="text-gray-600">Loading suggestions...</p>
        ) : (
          <ul className="space-y-3">
            {focusAreas.map((item, idx) => (
              <li key={idx} className="p-4 rounded-lg bg-primary-50 text-gray-800">
                {item}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
