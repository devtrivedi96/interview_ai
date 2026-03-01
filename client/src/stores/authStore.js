import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  createUserWithEmailAndPassword,
  getIdToken,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "../config/firebase";

const nowIso = () => new Date().toISOString();
const apiBaseUrl = import.meta.env.VITE_API_URL || "/api/v1";

const toIsoString = (value) => {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value?.toDate === "function") return value.toDate().toISOString();
  return null;
};

const syncUserDoc = async (firebaseUser) => {
  const userRef = doc(db, "users", firebaseUser.uid);
  const snap = await getDoc(userRef);
  const now = nowIso();

  if (snap.exists()) {
    const data = snap.data() || {};
    const createdAt =
      toIsoString(data.created_at) ||
      firebaseUser.metadata?.creationTime ||
      now;
    const mergedUser = {
      id: firebaseUser.uid,
      email: data.email || firebaseUser.email || "",
      email_verified: data.email_verified ?? firebaseUser.emailVerified ?? true,
      audio_consent: Boolean(data.audio_consent),
      created_at: createdAt,
      last_login: now,
      profile: data.profile || {},
    };

    await setDoc(
      userRef,
      {
        email: mergedUser.email,
        email_verified: mergedUser.email_verified,
        audio_consent: mergedUser.audio_consent,
        created_at: createdAt,
        last_login: now,
        updated_at: now,
        profile: mergedUser.profile,
      },
      { merge: true },
    );

    return mergedUser;
  }

  const newUser = {
    id: firebaseUser.uid,
    email: firebaseUser.email || "",
    email_verified: firebaseUser.emailVerified ?? true,
    audio_consent: false,
    created_at: firebaseUser.metadata?.creationTime || now,
    last_login: now,
    profile: {},
  };

  await setDoc(
    userRef,
    {
      email: newUser.email,
      email_verified: newUser.email_verified,
      audio_consent: false,
      created_at: newUser.created_at,
      last_login: now,
      updated_at: now,
      profile: {},
    },
    { merge: true },
  );

  return newUser;
};

const syncAudioConsentToBackend = async ({ consent, token, userId, email }) => {
  if (!userId) return;

  const params = new URLSearchParams({ consent: String(Boolean(consent)) });
  const headers = {
    "X-User-Id": userId,
    "X-User-Email": email || "",
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(
    `${apiBaseUrl}/auth/consent/audio?${params.toString()}`,
    {
      method: "POST",
      headers,
    },
  );

  if (!response.ok) {
    throw new Error(`Consent sync failed with status ${response.status}`);
  }
};

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
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              loading: false,
            });
            return;
          }

          try {
            const token = await getIdToken(firebaseUser, true);
            const userProfile = await syncUserDoc(firebaseUser);

            set({
              token,
              user: userProfile,
              isAuthenticated: true,
              loading: false,
              error: null,
            });

            try {
              await syncAudioConsentToBackend({
                consent: Boolean(userProfile.audio_consent),
                token,
                userId: userProfile.id,
                email: userProfile.email,
              });
            } catch (error) {
              console.warn("Backend audio consent sync failed:", error);
            }
          } catch (error) {
            console.error("Failed to fetch user profile:", error);
            set({
              user: null,
              token: null,
              isAuthenticated: false,
              loading: false,
            });
          }
        });
      },

      register: async (email, password, audioConsent = false) => {
        set({ loading: true, error: null });
        try {
          await createUserWithEmailAndPassword(auth, email, password);
          localStorage.setItem(
            "pending_audio_consent",
            audioConsent ? "true" : "false",
          );
          await signOut(auth);

          // Explicitly clear auth state after sign out
          set({
            loading: false,
            user: null,
            token: null,
            isAuthenticated: false,
          });
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
          const userCredential = await signInWithEmailAndPassword(
            auth,
            email,
            password,
          );

          const token = await getIdToken(userCredential.user, true);
          const userProfile = await syncUserDoc(userCredential.user);

          set({
            token,
            user: userProfile,
            isAuthenticated: true,
            loading: false,
          });

          try {
            await syncAudioConsentToBackend({
              consent: Boolean(userProfile.audio_consent),
              token,
              userId: userProfile.id,
              email: userProfile.email,
            });
          } catch (error) {
            console.warn("Backend audio consent sync failed:", error);
          }

          const pendingAudioConsent = localStorage.getItem(
            "pending_audio_consent",
          );
          if (pendingAudioConsent === "true") {
            await get().updateAudioConsent(true);
          }
          localStorage.removeItem("pending_audio_consent");

          return {
            success: true,
            token,
            user: userProfile,
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
        } catch (error) {
          console.error("Logout error:", error);
        }
      },

      refreshToken: async () => {
        const currentUser = auth.currentUser;
        if (currentUser) {
          try {
            const token = await getIdToken(currentUser, true);
            const userProfile = await syncUserDoc(currentUser);
            set({ token, user: userProfile, isAuthenticated: true });
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
          const currentUser = auth.currentUser;
          if (!currentUser) {
            throw new Error("No authenticated user");
          }

          const stateUser = get().user;
          const now = nowIso();
          await setDoc(
            doc(db, "users", currentUser.uid),
            {
              email: stateUser?.email || currentUser.email || "",
              email_verified:
                stateUser?.email_verified ?? currentUser.emailVerified ?? true,
              audio_consent: Boolean(consent),
              created_at:
                stateUser?.created_at ||
                currentUser.metadata?.creationTime ||
                now,
              last_login: now,
              updated_at: now,
            },
            { merge: true },
          );

          set((state) => {
            if (!state.user) return state;
            return {
              user: {
                ...state.user,
                audio_consent: Boolean(consent),
                last_login: now,
              },
            };
          });

          const state = get();
          await syncAudioConsentToBackend({
            consent: Boolean(consent),
            token: state.token,
            userId: state.user?.id || currentUser.uid,
            email: state.user?.email || currentUser.email || "",
          });
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
