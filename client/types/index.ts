export type InterviewMode = 'DSA' | 'HR';

export interface Feedback {
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

export interface Session {
  id: number;
  mode: InterviewMode;
  difficulty_start: number;
  state: string;
  created_at: string;
}
