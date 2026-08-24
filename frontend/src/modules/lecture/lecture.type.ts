export interface LectureQuestion {
  item_key: string;
  display: string;
  choices: string[];
  answer: string;
  show_text: boolean;
  text_contenu: string;
  text_titre: string;
  excerpt: string | null;          // toujours envoyé ; la fiche l'affiche après la réponse
  highlight_excerpt: boolean;      // surligné pendant la question : mode facile seulement
}

export interface LectureSessionResponse {
  session_id: string;
  questions: LectureQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}

export interface LectureTextSummary {
  id: number;
  titre: string;
  actif: boolean;
  question_count: number;
  play_count: number;
  last_played_at: string | null;
  best_correct: number;
  best_total: number;
}

export interface LectureAdminText {
  id: number;
  titre: string;
  contenu: string;
  actif: boolean;
  created_at: string;
  question_count: number;
}

export interface LectureAdminQuestion {
  id: number;
  text_id: number;
  question: string;
  answer: string;
  distractors: string[];
  excerpt: string | null;
  ordre: number;
}