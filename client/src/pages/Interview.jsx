import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sessionService } from '../services/sessionService'
import { Mic, Square, Loader } from 'lucide-react'

export default function Interview() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  
  const [question, setQuestion] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const startTimeRef = useRef(null)

  useEffect(() => {
    loadNextQuestion()
  }, [])

  const loadNextQuestion = async () => {
    setLoading(true)
    setError('')
    setEvaluation(null)
    setTranscript('')
    
    try {
      const data = await sessionService.getNextQuestion(sessionId)
      setQuestion(data)
    } catch (err) {
      if (err.response?.status === 400) {
        // Max questions reached
        navigate(`/session/${sessionId}/summary`)
      } else {
        setError('Failed to load question. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []
      startTimeRef.current = Date.now()

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const duration = (Date.now() - startTimeRef.current) / 1000
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop())
        
        // Submit answer
        await submitAnswer(audioBlob, duration)
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err) {
      console.error('Microphone error:', err)
      alert('Please allow microphone access to record your answer.')
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const submitAnswer = async (audioBlob, duration) => {
    setLoading(true)
    setError('')
    
    try {
      const audioFile = new File([audioBlob], 'answer.webm', { type: 'audio/webm' })
      
      const result = await sessionService.submitAnswer(sessionId, question.id, {
        audioFile,
        audioDuration: duration
      })
      
      setEvaluation(result)
      
      // Show transcript if available (from STT)
      if (result.transcript) {
        setTranscript(result.transcript)
      }
    } catch (err) {
      setError('Failed to evaluate answer. Please try again.')
      console.error('Submit error:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleComplete = async () => {
    try {
      await sessionService.completeSession(sessionId)
      navigate(`/session/${sessionId}/summary`)
    } catch (err) {
      console.error('Complete error:', err)
      navigate(`/session/${sessionId}/summary`)
    }
  }

  if (loading && !question) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader className="w-12 h-12 text-primary-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="card">
        {/* Question */}
        {question && (
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Question</h2>
              <span className="text-sm text-gray-600">
                Difficulty: {question.difficulty}/5
              </span>
            </div>
            <div className="bg-primary-50 rounded-lg p-6">
              <p className="text-lg text-gray-800">{question.question_text}</p>
            </div>
          </div>
        )}

        {/* Recording Controls */}
        {!evaluation && (
          <div className="mb-8">
            <div className="flex flex-col items-center space-y-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={loading}
                  className="flex items-center space-x-2 bg-red-500 text-white px-8 py-4 rounded-full font-semibold hover:bg-red-600 transition disabled:opacity-50"
                >
                  <Mic className="w-6 h-6" />
                  <span>Start Recording</span>
                </button>
              ) : (
                <button
                  onClick={stopRecording}
                  className="flex items-center space-x-2 bg-gray-800 text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-900 transition"
                >
                  <Square className="w-6 h-6" />
                  <span>Stop Recording</span>
                </button>
              )}
              
              {isRecording && (
                <p className="text-red-500 animate-pulse font-medium">
                  Recording... Speak your answer clearly
                </p>
              )}
              
              {loading && (
                <p className="text-gray-600 flex items-center space-x-2">
                  <Loader className="w-5 h-5 animate-spin" />
                  <span>Evaluating your answer...</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Evaluation Results */}
        {evaluation && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="text-gray-600 mb-2">Your Score</p>
              <p className="text-5xl font-bold text-primary-600">
                {evaluation.composite_score.toFixed(1)}/5.0
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Confidence: {(evaluation.eval_confidence * 100).toFixed(0)}%
              </p>
            </div>

            {/* Dimension Scores */}
            <div className="grid grid-cols-5 gap-2">
              {Object.entries(evaluation.dimension_scores).map(([dim, score]) => (
                <div key={dim} className="text-center">
                  <div className="text-2xl font-bold text-gray-700">{score.toFixed(1)}</div>
                  <div className="text-xs text-gray-500">D{dim.split('_')[1]}</div>
                </div>
              ))}
            </div>

            {/* Feedback */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-green-50 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-3">Strengths</h3>
                <ul className="space-y-2">
                  {evaluation.strengths.map((strength, i) => (
                    <li key={i} className="text-green-700 text-sm flex items-start">
                      <span className="mr-2">✓</span>
                      <span>{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-amber-50 rounded-lg p-4">
                <h3 className="font-semibold text-amber-800 mb-3">Areas to Improve</h3>
                <ul className="space-y-2">
                  {evaluation.improvements.map((improvement, i) => (
                    <li key={i} className="text-amber-700 text-sm flex items-start">
                      <span className="mr-2">→</span>
                      <span>{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-center space-x-4 pt-4">
              <button
                onClick={loadNextQuestion}
                className="btn-primary"
              >
                Next Question
              </button>
              <button
                onClick={handleComplete}
                className="btn-secondary"
              >
                Complete Session
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
