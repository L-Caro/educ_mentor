export interface TablesQuestion {
  fact_id: string;    // "3x7" (normalized min×max)
  display_a: number;  // left operand as shown to child
  display_b: number;  // right operand as shown to child
  answer: number;
  choices: number[];  // QCM : 2 ou 4 nombres mélangés ; saisie libre : []
}

export interface TablesSessionResponse {
  session_id: string;
  questions: TablesQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
}