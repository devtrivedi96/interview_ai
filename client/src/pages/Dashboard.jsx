import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { sessionService } from '../services/sessionService'
import { analyticsService } from '../services/analyticsService'
import { useProfileStore } from '../stores/profileStore'
import PreferencesModal from '../components/PreferencesModal'
import { Play, TrendingUp, Award } from 'lucide-react'

export default function Dashboard() {
  const [sessions, setSessions] = useState([])
  const [progress, setProgress] = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedMode, setSelectedMode] = useState('DSA')
  const [difficulty, setDifficulty] = useState(3)
  const [creating, setCreating] = useState(false)
  
  const navigate = useNavigate()
  const { showPreferencesModal, setShowModal, initPreferences } = useProfileStore()

  useEffect(() => {
    loadData()
  }, [])

  // Check preferences on component mount
  useEffect(() => {
    initPreferences()
  }, [])

  const loadData = async () => {
    try {
      const [sessionsData, progressData] = await Promise.all([
        sessionService.listSessions(10),
        analyticsService.getProgress(10)
      ])
      setSessions(sessionsData.sessions)
      setProgress(progressData)
    } catch (error) {
      console.error('Failed to load data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartInterview = async () => {
    setCreating(true)
    try {
      const session = await sessionService.createSession(selectedMode, difficulty)
      await sessionService.startSession(session.id)
      navigate(`/interview/${session.id}`)
    } catch (error) {
      console.error('Failed to create session:', error)
      alert('Failed to start interview. Please try again.')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Total Sessions</p>
              <p className="text-3xl font-bold">{progress?.total_sessions || 0}</p>
            </div>
            <Play className="w-12 h-12 text-primary-600 opacity-20" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Average Score</p>
              <p className="text-3xl font-bold">
                {progress?.mode_statistics?.[selectedMode]?.average_score?.toFixed(1) || 'N/A'}
              </p>
            </div>
            <TrendingUp className="w-12 h-12 text-green-600 opacity-20" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-sm">Best Score</p>
              <p className="text-3xl font-bold">
                {Math.max(...(progress?.sessions?.map(s => s.total_score || 0) || [0])).toFixed(1)}
              </p>
            </div>
            <Award className="w-12 h-12 text-yellow-600 opacity-20" />
          </div>
        </div>
      </div>

      {/* Start New Interview */}
      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Start New Interview</h2>
        
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Interview Type
            </label>
            <select
              value={selectedMode}
              onChange={(e) => setSelectedMode(e.target.value)}
              className="input"
            >
              <option value="DSA">DSA (Data Structures & Algorithms)</option>
              <option value="HR">HR/Behavioral</option>
              <option value="BEHAVIORAL">Behavioral</option>
              <option value="SYSTEM_DESIGN">System Design</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Starting Difficulty: {difficulty}
            </label>
            <input
              type="range"
              min="1"
              max="5"
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Easy</span>
              <span>Medium</span>
              <span>Hard</span>
            </div>
          </div>
        </div>

        <button
          onClick={handleStartInterview}
          disabled={creating}
          className="btn-primary mt-6 w-full md:w-auto"
        >
          {creating ? 'Starting...' : 'Start Interview'}
        </button>
      </div>

      {/* Recent Sessions */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>
        
        {sessions.length === 0 ? (
          <p className="text-gray-600 text-center py-8">
            No sessions yet. Start your first interview above!
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Mode
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Questions
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Score
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {sessions.map((session) => (
                  <tr key={session.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-primary-100 text-primary-800">
                        {session.mode}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {new Date(session.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {session.questions_count}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-primary-600">
                      {session.total_score ? session.total_score.toFixed(1) : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        session.state === 'COMPLETE' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {session.state}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {session.state === 'COMPLETE' && (
                        <button
                          onClick={() => navigate(`/session/${session.id}/summary`)}
                          className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                        >
                          View Summary
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      <PreferencesModal 
        isOpen={showPreferencesModal} 
        onClose={() => setShowModal(false)}
      />
    </div>
    </div>
  )
}
