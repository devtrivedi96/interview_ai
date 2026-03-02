import api from "./api";

const normalizeQuestion = (payload) => {
  if (!payload || typeof payload !== "object") return payload;
  const id = payload.id || payload.question_id;
  return id ? { ...payload, id } : payload;
};

export const sessionService = {
  // Get dynamic interview cards
  getInterviewCards: async () => {
    const response = await api.get("/sessions/modes/cards");
    return response.data;
  },

  // Create new session
  createSession: async (mode, difficultyStart = 3) => {
    if (!mode) {
      throw new Error("Interview mode is required to create a session");
    }
    const response = await api.post("/sessions", {
      mode,
      difficulty_start: difficultyStart,
    });
    return response.data;
  },

  // Start session
  startSession: async (sessionId) => {
    const response = await api.post(`/sessions/${sessionId}/start`);
    return normalizeQuestion(response.data);
  },

  // Get next question
  getNextQuestion: async (sessionId) => {
    const response = await api.post(`/sessions/${sessionId}/questions/next`);
    return normalizeQuestion(response.data);
  },

  // Submit answer
  submitAnswer: async (sessionId, questionId, data) => {
    const formData = new FormData();

    if (data.transcript) {
      formData.append("transcript", data.transcript);
    }

    if (data.audioFile) {
      formData.append("audio_file", data.audioFile);
    }

    if (data.audioDuration) {
      formData.append("audio_duration_sec", data.audioDuration);
    }

    const response = await api.post(
      `/sessions/${sessionId}/questions/${questionId}/answer`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );
    return response.data;
  },

  // Get session summary
  getSummary: async (sessionId) => {
    const response = await api.get(`/sessions/${sessionId}/summary`);
    return response.data;
  },

  // Get detailed Q&A history
  getQAHistory: async (sessionId) => {
    const response = await api.get(`/sessions/${sessionId}/qa-history`);
    return response.data;
  },

  // Alias for backward compatibility
  getSessionQuestions: async (sessionId) => {
    const response = await api.get(`/sessions/${sessionId}/qa-history`);
    return response.data;
  },

  // Complete session
  completeSession: async (sessionId) => {
    const response = await api.post(`/sessions/${sessionId}/complete`);
    return response.data;
  },

  // List sessions
  listSessions: async (limit = 10) => {
    const response = await api.get("/sessions", {
      params: { limit },
    });
    return response.data;
  },
};
