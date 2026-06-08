export interface AppModule {
  id: string;
  name: string;
  description: string;
  icon: string;
  is_active: boolean;
  display_order: number;
}

export interface Setting {
  key: string;
  value: string;
}

export type ImagierDifficulty = 'level_1' | 'level_2' | 'level_3';
export type ImagierMode = 'fr_to_en' | 'en_to_fr' | 'random';

export interface ImagierWord {
  id: string;
  slug: string;
  fr: string;
  en: string;
  category: string;
  subcategory?: string;
  image_filename?: string;
  is_active: boolean;
}

export interface ImagierProgression {
  id: string;
  word_id: string;
  correct_count: number;
  incorrect_count: number;
  is_mastered: boolean;
  mastered_at?: string;
  last_seen?: string;
}

export interface ImagierQuestion {
  word_id: string;
  image_url: string | null;
  prompt: string;
  choices: { id: string; label: string }[];
  correct_id: string;
  direction: 'fr_to_en' | 'en_to_fr';
}

export interface ImagierSessionResponse {
  session_id: string;
  questions: ImagierQuestion[];
  timer_seconds: number;
}

// ── Tables de multiplication ───────────────────────────────────────────────

export interface TablesQuestion {
  fact_id: string;    // "3x7" (normalized min×max)
  display_a: number;  // left operand as shown to child
  display_b: number;  // right operand as shown to child
  answer: number;
  choices: number[];  // 4 shuffled numbers
  hint: string;
}

export interface TablesSessionResponse {
  session_id: string;
  questions: TablesQuestion[];
  timer_seconds: number;
}

export interface TablesProgression {
  id: string;
  factor_a: number;
  factor_b: number;
  correct_count: number;
  incorrect_count: number;
  is_mastered: boolean;
  mastered_at?: string;
  last_seen?: string;
}

export interface TableStatus {
  table: number;
  is_known: boolean;
  mastered_count: number;
  in_progress_count: number;
  total_facts: number;
}

// ── Calcul Mental ─────────────────────────────────────────────────────────────

export interface CalculQuestion {
  operation: string;
  answer: number;
}

export interface CalculSessionResponse {
  session_id: string;
  questions: CalculQuestion[];
  timer_seconds: number;
  min_value: number;
  max_value: number;
  is_unlimited: boolean;
}

export interface CalculProgression {
  id: string;
  answer_value: number;
  correct_count: number;
  incorrect_count: number;
  is_mastered: boolean;
  last_seen: string | null;
}

export interface CalculSession {
  id: string;
  min_value: number;
  max_value: number;
  timer_seconds: number;
  correct_answers: number | null;
  total_questions: number | null;
  started_at: string;
  completed_at: string | null;
}

// ── Monnaie ───────────────────────────────────────────────────────────────────

export type MonnaieExerciseType = 'reconnaitre' | 'total' | 'rendre';

export interface MonnaieQuestion {
  type: MonnaieExerciseType;
  coins?: number[];    // centimes — pièces/billets à reconnaître
  prices?: number[];   // centimes — prix des articles (total)
  price?: number;      // centimes — prix de l'article (rendre)
  payment?: number;    // centimes — somme donnée (rendre)
  answer: number;      // centimes — réponse attendue
  choices?: number[];  // centimes — 4 options si mode QCM
}

export interface MonnaieSessionResponse {
  session_id: string;
  questions: MonnaieQuestion[];
  response_mode: 'free' | 'qcm';
  timer_seconds: number;
  is_unlimited: boolean;
}

export interface MonnaieProgression {
  id: string;
  exercise_type: string;
  answer_value: number;
  correct_count: number;
  incorrect_count: number;
  is_mastered: boolean;
  last_seen: string | null;
}

export interface MonnaieSession {
  id: string;
  exercise_type: string;
  timer_seconds: number;
  correct_answers: number | null;
  total_questions: number | null;
  started_at: string;
  completed_at: string | null;
}
