import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { sessionService } from '../services/sessionService'
import { Mic, Square, Loader, Volume2 } from 'lucide-react'

export default function Interview() {
  const { sessionId } = useParams()
  const navigate = useNavigate()
  
  const [question, setQuestion] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState('')
  const [evaluation, setEvaluation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSpeakingQuestion, setIsSpeakingQuestion] = useState(false)
  const [autoFlow, setAutoFlow] = useState(true)
  const [handsFree, setHandsFree] = useState(true)
  const [autoNextCountdown, setAutoNextCountdown] = useState(0)
  const [questionIndex, setQuestionIndex] = useState(1)
  
  const mediaRecorderRef = useRef(null)
  const audioChunksRef = useRef([])
  const startTimeRef = useRef(null)
  const utteranceRef = useRef(null)
  const autoNextTimerRef = useRef(null)

  useEffect(() => {
    loadNextQuestion()
  }, [])

  useEffect(() => {
    if (question?.question_text) {
      speakQuestion(question.question_text)
    }
    return () => {
      window.speechSynthesis.cancel()
      utteranceRef.current = null
    }
  }, [question?.id])

  useEffect(() => {
    if (!evaluation || !autoFlow) return

    setAutoNextCountdown(4)
    autoNextTimerRef.current = setInterval(() => {
      setAutoNextCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(autoNextTimerRef.current)
          loadNextQuestion()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => {
      if (autoNextTimerRef.current) clearInterval(autoNextTimerRef.current)
    }
  }, [evaluation, autoFlow])

  const speakQuestion = (text) => {
    if (!('speechSynthesis' in window) || !text) return
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = 0.95
    utterance.pitch = 1
    utterance.volume = 1
    utterance.onstart = () => setIsSpeakingQuestion(true)
    utterance.onend = () => {
      setIsSpeakingQuestion(false)
      if (handsFree && !evaluation && !isRecording) {
        startRecording()
      }
    }
    utterance.onerror = () => setIsSpeakingQuestion(false)
    utteranceRef.current = utterance
    window.speechSynthesis.speak(utterance)
  }

  const loadNextQuestion = async () => {
    if (autoNextTimerRef.current) {
      clearInterval(autoNextTimerRef.current)
      autoNextTimerRef.current = null
    }
    setAutoNextCountdown(0)
    setLoading(true)
    setError('')
    setEvaluation(null)
    setTranscript('')
    
    try {
      const data = await sessionService.getNextQuestion(sessionId)
      setQuestion(data)
      setQuestionIndex((prev) => prev + (question ? 1 : 0))
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
    if (!question?.id) {
      setError('Question is not ready yet. Please wait a moment and try again.')
      return
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      const questionIdAtRecordStart = question.id
      
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
        await submitAnswer(audioBlob, duration, questionIdAtRecordStart)
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

  const submitAnswer = async (audioBlob, duration, questionId) => {
    setLoading(true)
    setError('')
    
    try {
      if (!questionId) {
        throw new Error('Question ID missing for answer submission')
      }

      const audioFile = new File([audioBlob], 'answer.webm', { type: 'audio/webm' })
      
      const result = await sessionService.submitAnswer(sessionId, questionId, {
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
              <h2 className="text-xl font-semibold">Question {questionIndex}</h2>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600">
                  Difficulty: {question.difficulty}/5
                </span>
                <button
                  onClick={() => speakQuestion(question.question_text)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-300 text-sm hover:bg-gray-50"
                  type="button"
                >
                  <Volume2 className="w-4 h-4" />
                  {isSpeakingQuestion ? 'Speaking...' : 'Replay'}
                </button>
              </div>
            </div>
            <div className="bg-primary-50 rounded-lg p-6">
              <p className="text-lg text-gray-800">{question.question_text}</p>
            </div>
          </div>
        )}

        {/* Recording Controls */}
        {!evaluation && (
          <div className="mb-8">
            <div className="mb-4 flex flex-wrap gap-4">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={handsFree}
                  onChange={(e) => setHandsFree(e.target.checked)}
                />
                Hands-free recording
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={autoFlow}
                  onChange={(e) => setAutoFlow(e.target.checked)}
                />
                Auto next question
              </label>
            </div>

            <div className="flex flex-col items-center space-y-4">
              {!isRecording ? (
                <button
                  onClick={startRecording}
                  disabled={loading || !question || isSpeakingQuestion}
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
            {transcript && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                  Transcript (What AI Heard)
                </p>
                <p className="text-gray-800">{transcript}</p>
                {typeof evaluation.clarity_score === 'number' && (
                  <p className="text-sm mt-2 text-gray-600">
                    Clarity score: {evaluation.clarity_score.toFixed(2)}{' '}
                    {!evaluation.clarity_ok && (
                      <span className="text-amber-700">
                        (Try speaking slower and clearer for better scoring)
                      </span>
                    )}
                  </p>
                )}
                {evaluation.next_question_strategy && (
                  <p className="text-sm mt-1 text-gray-600">
                    Next strategy: <span className="font-medium">{evaluation.next_question_strategy}</span>
                  </p>
                )}
              </div>
            )}

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
                {autoFlow && autoNextCountdown > 0
                  ? `Next Question (${autoNextCountdown})`
                  : 'Next Question'}
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
