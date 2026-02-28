import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../services/api";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      // Initialize auth state from Firebase and backend
      initAuthListener: async () => {
        try {
          // Try to fetch current user from backend if we have a token
          const { token } = get();
          if (token) {
            try {
              const response = await api.get("/auth/me");
              set({
                user: response.data,
                isAuthenticated: true,
                loading: false,
              });
            } catch (error) {
              console.error("Failed to fetch user profile:", error);
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                loading: false,
              });
            }
          }
        } catch (error) {
          console.error("Auth initialization error:", error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            loading: false,
          });
        }
      },

      register: async (email, password, audioConsent = false) => {
        set({ loading: true, error: null });
        try {
          // Register user via backend API (which handles Firebase or mock auth)
          const response = await api.post("/auth/register", {
            email,
            password,
            audio_consent: audioConsent,
          });

          set({ loading: false });

          return {
            success: true,
            message: response.data.message || "Registration successful!",
            needsVerification: (response.data.message || "").toLowerCase().includes("verify your email"),
          };
        } catch (error) {
          const errorMessage =
            error.response?.data?.detail ||
            error.message ||
            "Registration failed";
          set({ loading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          // Authenticate via backend API (which handles Firebase or mock auth)
          const response = await api.post("/auth/login", {
            email,
            password,
          });

          const token = response.data.access_token || response.data.token;
          
          // Fetch user profile from backend
          const userResponse = await api.get("/auth/me", {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });

          set({
            token: token,
            user: userResponse.data,
            isAuthenticated: true,
            loading: false,
          });

          return {
            success: true,
            token: token,
            user: userResponse.data,
          };
        } catch (error) {
          const errorMessage =
            error.response?.data?.detail || error.message || "Login failed";
          set({ loading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      logout: async () => {
        try {
          set({ user: null, token: null, isAuthenticated: false });
          delete api.defaults.headers.common["Authorization"];
        } catch (error) {
          console.error("Logout error:", error);
        }
      },

      resendVerificationEmail: async (email) => {
        try {
          const response = await api.post("/auth/verify-email/resend", {
            email,
          });
          return {
            success: true,
            message: response.data.message || "Verification email sent!",
          };
        } catch (error) {
          const errorMessage =
            error.response?.data?.detail ||
            "Failed to resend verification email";
          throw new Error(errorMessage);
        }
      },

      refreshToken: async () => {
        const { user } = get();
        if (user) {
          try {
            const response = await api.get("/auth/me");
            set({ user: response.data });
            return true;
          } catch (error) {
            set({ token: null, user: null, isAuthenticated: false });
            return false;
          }
        }
        return false;
      },

      updateAudioConsent: async (consent) => {
        try {
          await api.post("/auth/consent/audio", null, {
            params: { consent },
          });
          set((state) => ({
            user: { ...state.user, audio_consent: consent },
          }));
        } catch (error) {
          console.error("Failed to update audio consent:", error);
          throw error;
        }
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    },
  ),
);
