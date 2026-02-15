import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface SessionCreate {
  mode: 'DSA' | 'HR';
  difficulty_start: number;
}

export interface SessionResponse {
  id: number;
  mode: string;
  difficulty_start: number;
  state: string;
  created_at: string;
}

export interface QuestionResponse {
  id: number;
  question_text: string;
  difficulty: number;
}

export interface AnswerSubmit {
  transcript: string;
  audio_duration_sec?: number;
}

export interface EvaluationResponse {
  composite_score: number;
  strengths: string[];
  improvements: string[];
  dimension_scores: {
    dimension_1: number;
    dimension_2: number;
    dimension_3: number;
    dimension_4: number;
    dimension_5: number;
  };
}

export interface SessionSummary {
  session_id: number;
  mode: string;
  total_score: number | null;
  duration_sec: number | null;
  questions_count: number;
  strengths: string[];
  improvements: string[];
  action_plan: string[];
}

export const authAPI = {
  register: async (email: string, password: string) => {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
  },
  
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    if (response.data.access_token) {
      localStorage.setItem('access_token', response.data.access_token);
    }
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
  },
};

export const sessionAPI = {
  create: async (data: SessionCreate): Promise<SessionResponse> => {
    const response = await api.post('/sessions', data);
    return response.data;
  },
  
  getNextQuestion: async (sessionId: number): Promise<QuestionResponse> => {
    const response = await api.post(`/sessions/${sessionId}/questions/next`);
    return response.data;
  },
  
  submitAnswer: async (sessionId: number, data: AnswerSubmit): Promise<EvaluationResponse> => {
    const response = await api.post(`/sessions/${sessionId}/answers`, data);
    return response.data;
  },
  
  getSummary: async (sessionId: number): Promise<SessionSummary> => {
    const response = await api.get(`/sessions/${sessionId}/summary`);
    return response.data;
  },
  
  complete: async (sessionId: number) => {
    const response = await api.post(`/sessions/${sessionId}/complete`);
    return response.data;
  },
};

export const userAPI = {
  getMe: async () => {
    const response = await api.get('/users/me');
    return response.data;
  },
  
  getProgress: async () => {
    const response = await api.get('/users/me/progress');
    return response.data;
  },
};

export default api;
