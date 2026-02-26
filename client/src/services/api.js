import axios from 'axios'
import { auth } from '../config/firebase'
import { useAuthStore } from '../stores/authStore'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add Firebase ID token
api.interceptors.request.use(
  async (config) => {
    const currentUser = auth.currentUser
    if (currentUser) {
      try {
        const idToken = await currentUser.getIdToken()
        config.headers.Authorization = `Bearer ${idToken}`
      } catch (error) {
        console.error('Error getting ID token:', error)
      }
    }
    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export default api
