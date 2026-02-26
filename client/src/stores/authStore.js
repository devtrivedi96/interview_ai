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

      // Initialize auth state (check if token is still valid)
      initAuthListener: async () => {
        const { token } = get();
        if (token) {
          try {
            // Verify token with backend
            const response = await api.get("/auth/me");
            set({
              user: response.data,
              isAuthenticated: true,
              loading: false,
            });
          } catch (error) {
            console.error("Auth state error:", error);
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              loading: false,
            });
          }
        }
      },

      register: async (email, password, audioConsent = false) => {
        set({ loading: true, error: null });
        try {
          // Register user via backend (sends verification email via Brevo)
          const response = await api.post("/auth/register", {
            email,
            password,
            audio_consent: audioConsent,
          });

          set({ loading: false });

          return {
            success: true,
            message:
              response.data.message ||
              "Registration successful! Please check your email to verify your account.",
            needsVerification: true,
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
          // Login with backend (returns JWT token)
          const response = await api.post("/auth/login", {
            email,
            password,
          });

          const { access_token, token_type } = response.data;

          // Fetch user profile
          const userResponse = await api.get("/auth/me", {
            headers: {
              Authorization: `${token_type} ${access_token}`,
            },
          });

          set({
            token: access_token,
            user: userResponse.data,
            isAuthenticated: true,
            loading: false,
          });

          // Set token in API client for future requests
          api.defaults.headers.common["Authorization"] =
            `${token_type} ${access_token}`;

          return {
            success: true,
            token: access_token,
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
