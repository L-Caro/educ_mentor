export type GrammaireQuestionType =
  | 'nature_mot'
  | 'trouver_mots'
  | 'trouver_fonction'
  | 'groupe_nominal';

export type NotionKey =
  | 'nom_commun'
  | 'nom_propre'
  | 'verbe'
  | 'determinant'
  | 'adjectif'
  | 'pronom_sujet'
  | 'invariable'
  | 'groupe_nominal'
  | 'sujet'
  | 'complement';

export interface NotionMeta {
  key: NotionKey;
  categorie: 'nature' | 'fonction';
  label: string;
  singulier: string;
  pluriel: string;
  defaultActive: boolean;
}

/** Le mot tel qu'il arrive du serveur : sa nature n'y est pas — c'est la réponse. */
export interface MotAffiche {
  mot: string;
  /** Ponctuation accolée, affichée mais jamais cliquable. */
  apres: string;
  /** Pas d'espace avant ce mot : il suit une élision (l’oiseau). */
  colle: boolean;
}

export interface GrammaireQuestion {
  item_key: string;
  type: GrammaireQuestionType;
  skill_key: NotionKey;
  display: string;
  mots: MotAffiche[];
  /** Index du mot souligné — `nature_mot` seulement. */
  cible: number | null;
  choices: string[];
  answer: string;
  /** Index des mots à toucher — types de sélection seulement. */
  answer_indices: number[];
}

export interface GrammaireSessionResponse {
  session_id: string;
  questions: GrammaireQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}

/** Une ligne de progression, avec sa notion — c'est ce qui rend la table
 * « notions à retravailler » lisible par le parent. */
export interface GrammaireProgressionStat {
  skill_key: NotionKey;
  correct_count: number;
  incorrect_count: number;
  is_mastered: boolean;
}
