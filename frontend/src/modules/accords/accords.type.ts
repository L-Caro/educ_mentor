export type NotionKey =
  | 'genre_nom'
  | 'nombre_nom'
  | 'accord_adjectif'
  | 'accord_gn'
  | 'accord_sujet_verbe';

/** Le type d'exercice et la notion coïncident dans ce module : un exercice par fiche. */
export type AccordsQuestionType = NotionKey;

export interface NotionMeta {
  key: NotionKey;
  label: string;
  consigne: string;
  defaultActive: boolean;
}

export interface AccordsQuestion {
  item_key: string;
  type: AccordsQuestionType;
  skill_key: NotionKey;
  display: string;
  /** Le point de départ d'une transformation : « un chat ». `null` sinon. */
  depart: string | null;
  /** Ce qui précède le trou. Les espaces sont significatifs. */
  avant: string;
  /** Ce qui suit le trou. */
  apres: string;
  /** L'indication entre parenthèses : l'adjectif ou l'infinitif à accorder. */
  indice: string | null;
  /** QCM ; vide = saisie libre. */
  choices: string[];
  answer: string;
}

export interface AccordsSessionResponse {
  session_id: string;
  questions: AccordsQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}

export interface AccordsProgressionStat {
  skill_key: NotionKey;
  correct_count: number;
  incorrect_count: number;
  is_mastered: boolean;
}
