export type DicteeNiveau = 'debutant' | 'normal' | 'difficile';

export interface DicteeSessionItem {
  id: string;
  contenu: string;
  notions: string[];
}

export interface DicteeSessionResponse {
  session_id: string;
  niveau: DicteeNiveau;
  preparee: boolean;
  items: DicteeSessionItem[];
  total_words: number;
}

export interface DicteeItem {
  id: string;
  niveau: DicteeNiveau;
  contenu: string;
  notions: string[];
  is_active: boolean;
  created_at: string;
}

export interface DicteeImportReport {
  inserted: number;
  skipped: number;
  replaced: boolean;
  errors: string[];
}

export interface DicteeWordError {
  word: string;
  incorrect_count: number;
  correct_count: number;
  last_seen: string | null;
}
