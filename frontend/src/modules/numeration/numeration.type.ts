export type PositionKey = 'u' | 'd' | 'c' | 'm' | 'dm' | 'cm';
export type QuestionType = 'comparaison' | 'suite' | 'decomposition' | 'valeur_positionnelle';

export interface NumerationQuestion {
  item_key:            string;
  type:                QuestionType;
  display:             string;
  answer:              string;
  choices:             string[];
  decompose_positions: PositionKey[] | null;
  suite_terms:         number[] | null;
}

export interface NumerationSessionResponse {
  session_id:    string;
  questions:     NumerationQuestion[];
  timer_seconds: number;
  is_unlimited:  boolean;
}