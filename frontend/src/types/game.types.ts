import type { ReactNode } from 'react';
import type { GameAnswerState } from 'src/hooks/useGameSession.ts';
import type { ModuleSetup } from 'src/store/slice/gameSetupSlice.ts';

export interface GameChoice {
  key: string;
  label: ReactNode;
}

/** Sous-ensemble configurable par le module pour le champ de saisie libre.
 * Les props de contrôle (value, onChange, onSubmit, answerState) sont gérées par <GameEngine>. */
export interface GameInputConfig {
  variant?: 'number' | 'text';
  placeholder?: string;
  maxLength?: number;
  numeric?: boolean;
  inputMode?: 'numeric' | 'decimal' | 'text';
  suffix?: ReactNode;
}

/** Contrat d'un module de jeu « question → réponse ». Le module ne déclare que SES
 * différences ; <GameEngine> fournit tout le squelette commun (timer, score, étoiles,
 * progression, dev mode, navigation). Le mode (QCM vs saisie libre) est dérivé de la
 * présence de choix sur la question. */
export interface GameModuleSpec<TSession, TQuestion> {
  loadSession: (setup: ModuleSetup) => Promise<TSession>;
  getQuestions?: (session: TSession) => TQuestion[];
  getSessionId?: (session: TSession) => string;
  getTimerSeconds?: (session: TSession) => number;

  renderPrompt: (question: TQuestion, answerState: GameAnswerState) => ReactNode;
  qcm?: {
    getChoices: (question: TQuestion) => GameChoice[];
    correctKey: (question: TQuestion) => string;
  };
  free?: {
    parse: (raw: string) => unknown;
    isCorrect: (question: TQuestion, given: unknown) => boolean;
    inputProps?: GameInputConfig;
  };
  correctionLabel: (question: TQuestion) => ReactNode;

  recordAnswer: (sessionId: string, question: TQuestion, correct: boolean, given: unknown) => Promise<void>;
  completeSession: (sessionId: string, correct: number, total: number) => Promise<void>;
  buildResultEntry: (question: TQuestion, given: unknown, correct: boolean, timeout: boolean) => GameResultEntry;

  emptyError?: string;
  showStreak?: boolean;
  showQuestionTag?: boolean;
}

export interface SetupChoice {
  value: string;
  label: string;
  icon?: string;
  description?: string;
}

/** Une option de pré-jeu : choix unique (`single`) ou multiple (`multi`).
 * `choices` statiques OU `loader` async (résolu par <ModulePreSetup> avant rendu). */
export type SetupOption =
  | { key: string; type: 'single'; label: string; choices?: SetupChoice[]; loader?: () => Promise<SetupChoice[]> }
  | { key: string; type: 'multi'; label: string; choices?: SetupChoice[]; loader?: () => Promise<SetupChoice[]> };

export type SetupValues = Record<string, string | string[]>;

/** Entrée de résultat normalisée, produite par `buildResultEntry` de chaque module et
 * consommée par <GameResultView> / <GameErrorList>. Une seule forme pour les 4 modules. */
export interface GameResultEntry {
  label: ReactNode;
  given: ReactNode | null;
  expected: ReactNode;
  correct: boolean;
  timeout: boolean;
  thumbUrl?: string | null;
}
