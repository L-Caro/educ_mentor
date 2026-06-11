export type MonnaieExerciseType = 'reconnaitre' | 'total' | 'rendre';

export interface MonnaieQuestion {
  type: MonnaieExerciseType;
  coins?: number[];    // centimes — pièces/billets à reconnaître
  prices?: number[];   // centimes — prix des articles (total)
  price?: number;      // centimes — prix de l'article (rendre)
  payment?: number;    // centimes — somme donnée (rendre)
  answer: number;      // centimes — réponse attendue
  choices: number[];   // centimes — QCM : 2 ou 4 ; saisie libre : []
}

export interface MonnaieSessionResponse {
  session_id: string;
  questions: MonnaieQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}
