export type TypeAlphabet = 'ranger' | 'intrus' | 'intercaler';

export interface QuestionAlphabet {
  item_key: string;
  type: TypeAlphabet;
  skill_key: string;
  consigne: string;
  mots: string[];
  /** Selon le type : les mots ranges, les deux mots echanges, ou le rang attendu. */
  reponse: string[];
  aPlacer: string | null;
  communes: number;
}

export interface AlphabetSession {
  session_id: string;
  questions: QuestionAlphabet[];
  timer_seconds: number;
  is_unlimited: boolean;
}

export interface MotTrouve {
  mot: string;
  exclu: boolean;
}

export interface EtatReferentiel {
  total: number;
  exclus: number;
  disponibles: number;
}
