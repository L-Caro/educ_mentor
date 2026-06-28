export type FranceQuestionType =
  | 'dept_to_number'
  | 'number_to_dept'
  | 'dept_to_prefecture'
  | 'prefecture_to_dept'
  | 'dept_to_region'
  | 'region_chef_lieu'
  | 'dept_borders'
  | 'dept_sub_prefectures'
  | 'region_depts'
  | 'region_old_names'
  | 'river_depts'
  | 'maritime_facade'
  | 'massif_summit'
  | 'summit_altitude'
  | 'dept_gentile';

export interface FranceQuestion {
  type: FranceQuestionType;
  item_key: string;
  prompt: string;
  display: string;
  choices: string[];
  answer: string | null;
  answers: string[] | null;
}

export interface FranceSessionResponse {
  session_id: string;
  questions: FranceQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}
