import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { sessionService } from '../services/sessionService'
import { Briefcase, Cpu, Layers3, Play, UserRound } from 'lucide-react'

const interviewModes = [
  {
    key: 'DSA',
    title: 'DSA',
    subtitle: 'Data Structures & Algorithms',
    icon: Cpu,
    description: 'Problem solving, complexity, and coding fundamentals.',
    tone: 'from-blue-500 to-cyan-500',
  },
  {
    key: 'HR',
    title: 'HR',
    subtitle: 'Behavioral & Experience',
    icon: Briefcase,
    description: 'Communication, leadership, and impact storytelling.',
    tone: 'from-emerald-500 to-teal-500',
  },
  {
    key: 'BEHAVIORAL',
    title: 'Behavioral',
    subtitle: 'Situational Questions',
    icon: UserRound,
    description: 'STAR structure and decision-making scenarios.',
    tone: 'from-orange-500 to-amber-500',
  },
  {
    key: 'SYSTEM_DESIGN',
    title: 'System Design',
    subtitle: 'Architecture & Tradeoffs',
    icon: Layers3,
    description: 'Scalability, reliability, and API/data design.',
    tone: 'from-violet-500 to-fuchsia-500',
  },
]

const iconMap = {
  DSA: Cpu,
  HR: Briefcase,
  BEHAVIORAL: UserRound,
  SYSTEM_DESIGN: Layers3,
}

const toneMap = {
  DSA: 'from-blue-500 to-cyan-500',
  HR: 'from-emerald-500 to-teal-500',
  BEHAVIORAL: 'from-orange-500 to-amber-500',
  SYSTEM_DESIGN: 'from-violet-500 to-fuchsia-500',
}

export default function InterviewCenter() {
  const navigate = useNavigate()
  const [selectedMode, setSelectedMode] = useState('DSA')
  const [difficulty, setDifficulty] = useState(3)
  const [creating, setCreating] = useState(false)
  const [cards, setCards] = useState(interviewModes)
  const [cardsLoading, setCardsLoading] = useState(true)

  useEffect(() => {
    const loadCards = async () => {
      try {
        const data = await sessionService.getInterviewCards()
        if (Array.isArray(data?.cards) && data.cards.length > 0) {
          setCards(data.cards)
          if (!data.cards.find((c) => c.mode === selectedMode)) {
            setSelectedMode(data.cards[0].mode)
            setDifficulty(Number(data.cards[0].difficulty_start || 3))
          }
        }
      } catch (error) {
        console.error('Failed to load interview cards:', error)
      } finally {
        setCardsLoading(false)
      }
    }

    loadCards()
  }, [])

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

  return (
    <div className="max-w-6xl">
      <h1 className="text-3xl font-bold mb-2">Interview</h1>
      <p className="text-gray-600 mb-8">Choose an interview track and start instantly.</p>

      {cardsLoading ? (
        <p className="text-gray-600 mb-8">Loading interview tracks...</p>
      ) : (
      <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-8">
        {cards.map((mode) => {
          const modeKey = mode.key || mode.mode
          const Icon = iconMap[modeKey] || Cpu
          const tone = toneMap[modeKey] || 'from-blue-500 to-cyan-500'
          const active = selectedMode === modeKey

          return (
            <button
              key={modeKey}
              onClick={() => {
                setSelectedMode(modeKey)
                if (mode.difficulty_start) setDifficulty(Number(mode.difficulty_start))
              }}
              className={[
                'text-left rounded-2xl border p-5 min-h-[230px] transition-all',
                'hover:shadow-lg hover:-translate-y-0.5',
                active
                  ? 'border-primary-500 ring-2 ring-primary-200 bg-primary-50'
                  : 'border-gray-200 bg-white',
              ].join(' ')}
            >
              <div className={`inline-flex p-3 rounded-xl text-white bg-gradient-to-br ${tone}`}>
                <Icon className="w-5 h-5" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-gray-900">{mode.title || modeKey}</h2>
              <p className="text-sm text-gray-600">{mode.subtitle || 'Interview Practice'}</p>
              <p className="mt-3 text-sm text-gray-700 leading-relaxed">{mode.description || 'Practice this mode with adaptive AI questions.'}</p>
            </button>
          )
        })}
      </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          <div>
            <h3 className="text-xl font-semibold mb-2">Session Settings</h3>
            <p className="text-gray-600 mb-4">
              Selected mode: <span className="font-medium text-gray-900">{selectedMode}</span>
            </p>
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
              <span>1 Easy</span>
              <span>3 Medium</span>
              <span>5 Hard</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">Ready to begin?</h4>
            <p className="text-sm text-gray-600 mb-5">
              Click start to create a new session and move directly to your first question.
            </p>
            <button
              onClick={handleStartInterview}
              disabled={creating}
              className="btn-primary w-full inline-flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              {creating ? 'Starting...' : 'Start Session'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
