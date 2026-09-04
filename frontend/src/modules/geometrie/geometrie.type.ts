export type GeometrieQuestionType =
  | 'nom_figure'
  | 'nom_solide'
  | 'cotes_sommets'
  | 'angle_droit'
  | 'proprietes';

export type ShapeFamille =
  | 'triangle'
  | 'quadrilatere'
  | 'polygone'
  | 'cercle'
  | 'solide';

export interface ShapeMeta {
  key: string;
  nom: string;
  famille: ShapeFamille;
  type: 'plane' | 'solide';
  cotes: number | null;
  sommets: number | null;
  angleDroit: boolean | null;
  cotesEgaux: boolean | null;
  faces: number | null;
  aretes: number | null;
  defaultActive: boolean;
}

export interface GeometrieQuestion {
  item_key: string;
  type: GeometrieQuestionType;
  skill_key: string;
  display: string;
  shape: string;
  shapeB: string | null;
  shape_meta: ShapeMeta;
  shape_b_meta: ShapeMeta | null;
  choices: string[];
  answer: string;
}

export interface GeometrieSessionResponse {
  session_id: string;
  questions: GeometrieQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}
