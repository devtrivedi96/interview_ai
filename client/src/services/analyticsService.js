import api from './api'

export const analyticsService = {
  // Get user progress
  getProgress: async (limit = 10) => {
    const response = await api.get('/analytics/progress', {
      params: { limit }
    })
    return response.data
  },

  // Get detailed insights
  getInsights: async (days = 30) => {
    const response = await api.get('/analytics/insights', {
      params: { days }
    })
    return response.data
  },

  // Get leaderboard
  getLeaderboard: async (mode = null, limit = 10) => {
    const response = await api.get('/analytics/leaderboard', {
      params: { mode, limit }
    })
    return response.data
  }
}
