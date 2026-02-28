import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createUserWithEmailAndPassword,
  getIdToken,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import api from "../services/api";
import { auth } from "../config/firebase";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      initAuthListener: async () => {
        onAuthStateChanged(auth, async (firebaseUser) => {
          if (!firebaseUser) {
            set({ user: null, token: null, isAuthenticated: false, loading: false });
            return;
          }

          try {
            const token = await getIdToken(firebaseUser, true);
            const response = await api.get("/auth/me", {
              headers: { Authorization: `Bearer ${token}` },
            });

            set({
              token,
              user: response.data,
              isAuthenticated: true,
              loading: false,
              error: null,
            });
          } catch (error) {
            console.error("Failed to fetch user profile:", error);
            set({ user: null, token: null, isAuthenticated: false, loading: false });
          }
        });
      },

      register: async (email, password, audioConsent = false) => {
        set({ loading: true, error: null });
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          await signOut(auth);

          set({ loading: false });
          return {
            success: true,
            message: "Account created successfully. You can log in now.",
            needsVerification: false,
          };
        } catch (error) {
          const errorMessage = error.message || "Registration failed";
          set({ loading: false, error: errorMessage });
          throw new Error(errorMessage);
        }
      },

      login: async (email, password) => {
        set({ loading: true, error: null });
        try {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);

          const token = await getIdToken(userCredential.user, true);
          const userResponse = await api.get("/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });

          set({
            token,
            user: userResponse.data,
            isAuthenticated: true,
            loading: false,
          });

          return {
            success: true,
            token,
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
          await signOut(auth);
          set({ user: null, token: null, isAuthenticated: false });
          delete api.defaults.headers.common["Authorization"];
        } catch (error) {
          console.error("Logout error:", error);
        }
      },

      refreshToken: async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          try {
            const token = await getIdToken(currentUser, true);
            const response = await api.get("/auth/me", {
              headers: { Authorization: `Bearer ${token}` },
            });
            set({ token, user: response.data, isAuthenticated: true });
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
