import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sessionService } from '../services/sessionService'
import { analyticsService } from '../services/analyticsService'
import { useProfileStore } from '../stores/profileStore'
import { useAuthStore } from '../stores/authStore'
import PreferencesModal from '../components/PreferencesModal'
import { Award, BarChart3, Play, TrendingUp, User } from 'lucide-react'
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
} from 'recharts'

const PIE_COLORS = ['#0ea5e9', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444']

export default function Dashboard() {
  const [sessions, setSessions] = useState([])
  const [progress, setProgress] = useState(null)
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMode, setSelectedMode] = useState('DSA')
  const [difficulty, setDifficulty] = useState(3)
  const [creating, setCreating] = useState(false)

  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    showPreferencesModal,
    setShowModal,
    initPreferences,
    preferences,
    fetchPreferences,
  } = useProfileStore()

  const initDoneRef = useRef(false)

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (initDoneRef.current) return
    initDoneRef.current = true
    initPreferences()
    fetchPreferences()
  }, [initPreferences, fetchPreferences])

  const loadData = async () => {
    try {
      const [sessionsData, progressData, cardsData] = await Promise.all([
        sessionService.listSessions(20),
        analyticsService.getProgress(20),
        sessionService.getInterviewCards().catch(() => ({ cards: [] })),
      ])
      const loadedSessions = sessionsData?.sessions || []
      setSessions(loadedSessions)
      setProgress(progressData)
      setCards(cardsData?.cards || [])

      if (loadedSessions.length > 0 && !loadedSessions.find((s) => s.mode === selectedMode)) {
        setSelectedMode(loadedSessions[0].mode)
      }
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

  const modeCounts = useMemo(() => {
    const counts = sessions.reduce((acc, s) => {
      acc[s.mode] = (acc[s.mode] || 0) + 1
      return acc
    }, {})
    return Object.entries(counts).map(([mode, count]) => ({ mode, count }))
  }, [sessions])

  const scoreTrend = useMemo(() => {
    return sessions
      .filter((s) => s.total_score !== null && s.total_score !== undefined)
      .slice()
      .reverse()
      .map((s, idx) => ({
        label: `S${idx + 1}`,
        score: Number(s.total_score),
      }))
  }, [sessions])

  const topMode = useMemo(() => {
    if (!modeCounts.length) return 'N/A'
    return modeCounts.slice().sort((a, b) => b.count - a.count)[0].mode
  }, [modeCounts])

  const averageScore = useMemo(() => {
    const scored = sessions.filter((s) => s.total_score !== null && s.total_score !== undefined)
    if (!scored.length) return null
    return scored.reduce((sum, s) => sum + Number(s.total_score), 0) / scored.length
  }, [sessions])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="card">
          <p className="text-gray-600 text-sm">Total Sessions</p>
          <p className="text-3xl font-bold mt-1">{progress?.total_sessions || sessions.length || 0}</p>
        </div>

        <div className="card">
          <p className="text-gray-600 text-sm">Average Score</p>
          <p className="text-3xl font-bold mt-1">{averageScore ? averageScore.toFixed(1) : 'N/A'}</p>
        </div>

        <div className="card">
          <p className="text-gray-600 text-sm">Available Interview Tracks</p>
          <p className="text-3xl font-bold mt-1">{cards.length || 4}</p>
        </div>

        <div className="card">
          <p className="text-gray-600 text-sm">Most Used Interview Type</p>
          <p className="text-xl font-bold mt-2">{topMode}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 mb-8">
        <div className="card lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold">Profile Snapshot</h2>
          </div>
          <p className="text-sm text-gray-600">Email</p>
          <p className="font-medium mb-3 break-all">{user?.email || 'N/A'}</p>

          <p className="text-sm text-gray-600">Experience</p>
          <p className="font-medium mb-3 capitalize">{preferences?.experience_level || 'Not set'}</p>

          <p className="text-sm text-gray-600">Preferred Roles</p>
          <p className="font-medium mb-3">{preferences?.preferred_roles?.join(', ') || 'Not set'}</p>

          <p className="text-sm text-gray-600">Preferred Modes</p>
          <p className="font-medium">{preferences?.preferred_interview_modes?.join(', ') || 'Not set'}</p>
        </div>

        <div className="card lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <BarChart3 className="w-5 h-5 text-primary-600" />
            <h2 className="text-lg font-semibold">Interview Type Distribution</h2>
          </div>
          {modeCounts.length ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={modeCounts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mode" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#0ea5e9" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-600">No session data yet.</p>
          )}
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Score Trend</h2>
          {scoreTrend.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={scoreTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="label" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-600">Complete interviews to see your score trend.</p>
          )}
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold mb-4">Mode Share</h2>
          {modeCounts.length ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie data={modeCounts} dataKey="count" nameKey="mode" outerRadius={90} label>
                  {modeCounts.map((entry, idx) => (
                    <Cell key={`${entry.mode}-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-600">No interviews yet.</p>
          )}
        </div>
      </div>

      <div className="card mb-8">
        <h2 className="text-xl font-semibold mb-4">Start New Interview</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Interview Type</label>
            <select value={selectedMode} onChange={(e) => setSelectedMode(e.target.value)} className="input">
              {(cards.length ? cards : [
                { mode: 'DSA', title: 'DSA' },
                { mode: 'HR', title: 'HR' },
                { mode: 'BEHAVIORAL', title: 'Behavioral' },
                { mode: 'SYSTEM_DESIGN', title: 'System Design' },
              ]).map((c) => (
                <option key={c.mode} value={c.mode}>{c.title || c.mode}</option>
              ))}
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
          className="btn-primary mt-6 w-full md:w-auto inline-flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          {creating ? 'Starting...' : 'Start Interview'}
        </button>
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">Recent Sessions</h2>

        {sessions.length === 0 ? (
          <p className="text-gray-600 text-center py-8">No sessions yet. Start your first interview above!</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mode</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Questions</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
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
                    <td className="px-4 py-3 text-sm text-gray-600">{new Date(session.created_at).toLocaleDateString()}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{session.questions_count}</td>
                    <td className="px-4 py-3 text-sm font-semibold text-primary-600">
                      {session.total_score ? Number(session.total_score).toFixed(1) : 'N/A'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          session.state === 'COMPLETE' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
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
      </div>

      <PreferencesModal isOpen={showPreferencesModal} onClose={() => setShowModal(false)} />
    </div>
  )
}
