export interface PenduSessionResponse {
  session_id: string;
  word: string;
  pre_revealed: string[];
  max_errors: number;
}

export interface PenduWord {
  id: string;
  word: string;
  difficulty: string;   // 'easy' | 'normal' | 'hard'
  is_active: boolean;
  created_at: string;
}