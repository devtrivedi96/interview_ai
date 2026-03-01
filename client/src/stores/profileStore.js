import { create } from "zustand";
import { persist } from "zustand/middleware";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";
import { useAuthStore } from "./authStore";

const nowIso = () => new Date().toISOString();

const toIsoString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  return null;
};

const getUserId = () =>
  useAuthStore.getState().user?.id || auth.currentUser?.uid || null;

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
          const userId = getUserId();
          if (!userId) {
            set({
              preferences: null,
              preferencesExists: false,
              loading: false,
            });
            return false;
          }

          const userSnap = await getDoc(doc(db, "users", userId));
          const userData = userSnap.exists() ? userSnap.data() || {} : {};
          const rawPreferences = (userData.profile || {}).preferences;
          const exists = Boolean(rawPreferences);
          const preferences = rawPreferences
            ? {
                ...rawPreferences,
                updated_at: toIsoString(rawPreferences.updated_at) || nowIso(),
              }
            : null;

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
            error: error.message || "Failed to fetch preferences",
          });
          return false;
        }
      },

      // Save preferences
      savePreferences: async (prefsData) => {
        set({ loading: true, error: null });
        try {
          const userId = getUserId();
          if (!userId) {
            throw new Error("User must be logged in to save preferences");
          }

          const now = nowIso();
          const preferences = {
            tech_stack: prefsData.tech_stack,
            preferred_roles: prefsData.preferred_roles,
            experience_level: prefsData.experience_level,
            target_company_type: prefsData.target_company_type,
            preferred_interview_modes: prefsData.preferred_interview_modes,
            updated_at: now,
          };

          await setDoc(
            doc(db, "users", userId),
            {
              profile: { preferences },
              updated_at: now,
            },
            { merge: true },
          );

          const exists = true;
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
            error: error.message || "Failed to save preferences",
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
