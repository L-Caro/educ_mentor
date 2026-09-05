export type Operation = '+' | '-' | '×' | '÷';

/** Une étape : « 25 × 4 = 100 ». Même forme côté serveur, où elle décrit la solution de
 * référence, et côté enfant, où elle décrit ce qu'elle vient de faire. */
export interface Etape {
  a: number;
  operation: Operation;
  b: number;
  resultat: number;
}

export interface CompteQuestion {
  item_key: string;
  skill_key: string;
  cible: number;
  plaques: number[];
  /** Une solution — pas LA solution. Sert à montrer un chemin après un échec. */
  solution: Etape[];
  /** Les opérations ouvertes : le clavier d'opérateurs se construit depuis là. */
  operations: Operation[];
}

export interface CompteSessionResponse {
  session_id: string;
  questions: CompteQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}
