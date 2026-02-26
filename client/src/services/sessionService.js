import api from './api'

export const sessionService = {
  // Create new session
  createSession: async (mode, difficultyStart = 3) => {
    const response = await api.post('/sessions', {
      mode,
      difficulty_start: difficultyStart
    })
    return response.data
  },

  // Start session
  startSession: async (sessionId) => {
    const response = await api.post(`/sessions/${sessionId}/start`)
    return response.data
  },

  // Get next question
  getNextQuestion: async (sessionId) => {
    const response = await api.post(`/sessions/${sessionId}/questions/next`)
    return response.data
  },

  // Submit answer
  submitAnswer: async (sessionId, questionId, data) => {
    const formData = new FormData()
    
    if (data.transcript) {
      formData.append('transcript', data.transcript)
    }
    
    if (data.audioFile) {
      formData.append('audio_file', data.audioFile)
    }
    
    if (data.audioDuration) {
      formData.append('audio_duration_sec', data.audioDuration)
    }

    const response = await api.post(
      `/sessions/${sessionId}/questions/${questionId}/answer`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    )
    return response.data
  },

  // Get session summary
  getSummary: async (sessionId) => {
    const response = await api.get(`/sessions/${sessionId}/summary`)
    return response.data
  },

  // Complete session
  completeSession: async (sessionId) => {
    const response = await api.post(`/sessions/${sessionId}/complete`)
    return response.data
  },

  // List sessions
  listSessions: async (limit = 10) => {
    const response = await api.get('/sessions', {
      params: { limit }
    })
    return response.data
  }
}
