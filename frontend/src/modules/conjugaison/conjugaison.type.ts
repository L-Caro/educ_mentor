export type Pronom = 'je' | 'tu' | 'il' | 'elle' | 'on' | 'nous' | 'vous' | 'ils' | 'elles';
export type QuestionDirection = 'forward' | 'reverse';

export interface ConjugaisonQuestion {
  infinitif: string;
  tense: string;
  pronoun: Pronom;
  conjugated: string;         // forme conjuguée seule, sans le pronom (ex : "ai", "mange")
  groupe: string;
  direction: QuestionDirection;
  choices: string[];          // formes conjuguées (forward) ou infinitifs (reverse) ; vide si saisie libre
  forms: Record<Pronom, string>;  // les six formes à ce temps, pour la fiche de leçon
}

export interface ConjugaisonSessionResponse {
  session_id: string;
  questions: ConjugaisonQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}