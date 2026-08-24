export type NumeralType = 'arabic' | 'roman';

export interface HeureQuestion {
  hour: number;           // 0-23
  minute: number;         // 0-59
  answer_value: number;   // minutes depuis minuit : hour * 60 + minute
  numeral_type: NumeralType;
  choices: number[];      // minutes depuis minuit ; vide si saisie libre
  separator?: ':' | 'h'; // injecté côté frontend par getQuestions
  questionMode?: 'digital' | 'expression'; // idem : la fiche n'a accès qu'à la question
}

export interface HeureSessionResponse {
  session_id: string;
  questions: HeureQuestion[];
  timer_seconds: number;
  is_unlimited: boolean;
  separator: ':' | 'h';       // injecté côté frontend par loadSession
  questionMode: 'digital' | 'expression';  // injecté côté frontend par loadSession
}