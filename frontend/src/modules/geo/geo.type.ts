export type GeoQuestionType =
  | 'country_to_capital'
  | 'capital_to_country'
  | 'country_to_continent'
  | 'country_to_ocean'
  | 'flag_to_country'
  | 'country_to_flag'
  | 'odd_one_out'
  | 'country_to_language'
  | 'select_oceans'
  | 'select_continent_countries'
  | 'country_borders'
  | 'select_language_countries'
  | 'identify_country'
  | 'identify_continent';

export interface GeoQuestion {
  type: GeoQuestionType;
  item_key: string;
  prompt: string;
  display: string;
  display_type: 'flag' | 'text';
  choices: string[];
  answer: string | null;
  answers: string[] | null;
  continent?: string | null;
  map_filter?: string[] | null;
}

export interface GeoSessionResponse {
  session_id: string;
  questions: GeoQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}
