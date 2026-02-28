import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../services/api";

export const useProfileStore = create(
  persist(
    (set, get) => ({
      preferences: null,
      preferencesExists: false,
      loading: false,
      error: null,
      showPreferencesModal: false,
      hasCompletedPreferences: false,

      // Fetch user preferences
      fetchPreferences: async () => {
        set({ loading: true, error: null });
        try {
          const response = await api.get("/profile/preferences");
          const { exists, preferences } = response.data;

          set({
            preferences,
            preferencesExists: exists,
            hasCompletedPreferences: exists || get().hasCompletedPreferences,
            loading: false,
          });

          return exists;
        } catch (error) {
          console.error("Failed to fetch preferences:", error);
          set({
            loading: false,
            error: error.response?.data?.detail || "Failed to fetch preferences",
          });
          return false;
        }
      },

      // Save preferences
      savePreferences: async (prefsData) => {
        set({ loading: true, error: null });
        try {
          const response = await api.post("/profile/preferences", {
            tech_stack: prefsData.tech_stack,
            preferred_roles: prefsData.preferred_roles,
            experience_level: prefsData.experience_level,
            target_company_type: prefsData.target_company_type,
            preferred_interview_modes: prefsData.preferred_interview_modes,
          });

          const { exists, preferences } = response.data;
          set({
            preferences,
            preferencesExists: exists,
            hasCompletedPreferences: true,
            loading: false,
            showPreferencesModal: false,
          });

          return true;
        } catch (error) {
          console.error("Failed to save preferences:", error);
          set({
            loading: false,
            error: error.response?.data?.detail || "Failed to save preferences",
          });
          return false;
        }
      },

      // Set modal visibility
      setShowModal: (show) => set({ showPreferencesModal: show }),

      // Initialize preferences on login
      initPreferences: async () => {
        const exists = await get().fetchPreferences();
        if (!exists && !get().hasCompletedPreferences) {
          set({ showPreferencesModal: true });
        }
        return exists;
      },
    }),
    {
      name: "profile-storage",
      partialize: (state) => ({
        hasCompletedPreferences: state.hasCompletedPreferences,
      }),
    },
  ),
);
