import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../services/api'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email, password) => {
        const response = await api.post('/auth/login', { email, password })
        const { access_token } = response.data
        
        set({ token: access_token, isAuthenticated: true })
        
        // Fetch user profile
        const userResponse = await api.get('/auth/me')
        set({ user: userResponse.data })
        
        return response.data
      },

      register: async (email, password, audioConsent = false) => {
        const response = await api.post('/auth/register', {
          email,
          password,
          audio_consent: audioConsent
        })
        return response.data
      },

      resendVerificationEmail: async (email) => {
        const response = await api.post('/auth/verify-email/resend', {
          email
        })
        return response.data
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateAudioConsent: async (consent) => {
        await api.post('/auth/consent/audio', null, {
          params: { consent }
        })
        set((state) => ({
          user: { ...state.user, audio_consent: consent }
        }))
      },

      fetchUser: async () => {
        try {
          const response = await api.get('/auth/me')
          set({ user: response.data })
        } catch (error) {
          set({ user: null, token: null, isAuthenticated: false })
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
)
