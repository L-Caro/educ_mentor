export interface CalculQuestion {
  operation: string;
  answer: number;
  choices: number[]; // QCM : 2 ou 4 ; saisie libre : []
}

export interface CalculSessionResponse {
  session_id: string;
  questions: CalculQuestion[];
  timer_seconds: number;
  min_value: number;
  max_value: number;
  is_unlimited: boolean;
}
