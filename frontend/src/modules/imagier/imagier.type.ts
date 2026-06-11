export interface ImagierWord {
  id: string;
  slug: string;
  fr: string;
  en: string;
  category: string;
  subcategory?: string;
  image_filename?: string;
  is_active: boolean;
}

export interface ImagierQuestion {
  word_id: string;
  image_url: string | null;
  prompt: string;
  choices: { id: string; label: string }[]; // QCM : 2 ou 4 ; saisie libre : []
  correct_id: string;
  answer: string; // libellé de la bonne réponse (valide la saisie libre sans choix)
  direction: 'fr_to_en' | 'en_to_fr';
}

export interface ImagierSessionResponse {
  session_id: string;
  questions: ImagierQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}
