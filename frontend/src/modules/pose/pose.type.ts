export type PoseOperation = 'addition' | 'soustraction' | 'multiplication';
export type MethodeSoustraction = 'compensation' | 'cassage';

/** Marques de retenue, indexées depuis la DROITE (unités = 0). */
export interface Retenues {
  haut: (number | null)[];
  bas: (number | null)[];
}

/** Un produit partiel : sa valeur, et de combien de rangs il se décale vers la gauche.
 * C'est le décalage qui fait toute la difficulté de la multiplication posée. */
export interface ProduitPartiel {
  valeur: number;
  decalage: number;
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
  /** Comment lire les marques du haut : par compensation elles s'ajoutent au chiffre,
   *  par cassage elles le remplacent, et le chiffre d'origine est alors barré. */
  method: MethodeSoustraction;
  /** Les produits partiels : multiplication seulement, vide ailleurs. */
  partiels: ProduitPartiel[];
}

export interface PoseSessionResponse {
  session_id: string;
  questions: PoseQuestion[];
  timer_seconds: 0;
  is_unlimited: boolean;
  method: MethodeSoustraction;
}
