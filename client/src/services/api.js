import axios from 'axios'
import { useAuthStore } from '../stores/authStore'
import { auth } from '../config/firebase'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  async (config) => {
    const authState = useAuthStore.getState()
    const token = authState.token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Prefer app user state to avoid transient auth.currentUser null on refresh.
    const headerUserId = authState.user?.id || auth.currentUser?.uid
    const headerEmail = authState.user?.email || auth.currentUser?.email || ''
    if (headerUserId) {
      config.headers['X-User-Id'] = headerUserId
      config.headers['X-User-Email'] = headerEmail
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
