export type PoseOperation = 'addition' | 'soustraction';
export type MethodeSoustraction = 'compensation' | 'cassage';

/** Marques de retenue, indexées depuis la DROITE (unités = 0). */
export interface Retenues {
  haut: (number | null)[];
  bas: (number | null)[];
}

export interface PoseQuestion {
  skill_key: string;
  operation: PoseOperation;
  operands: number[];
  answer: number;
  answer_length: number;
  columns: number;
  has_carry: boolean;
  retenues: Retenues;
  /** filled = montrées remplies · empty = cases à remplir · hidden = aucune case */
  carry_display: 'filled' | 'empty' | 'hidden';
}

export interface PoseSessionResponse {
  session_id: string;
  questions: PoseQuestion[];
  timer_seconds: 0;
  is_unlimited: boolean;
  method: MethodeSoustraction;
}
