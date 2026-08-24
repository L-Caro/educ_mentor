import type { ComponentType, ReactNode } from 'react';
import type { GameAnswerState } from 'src/hooks/useGameSession.ts';
import type { ModuleSetup } from 'src/store/slice/gameSetupSlice.ts';

/** Props injectées dans un composant de carte à placement de point (locate_city).
 * Le composant reçoit la cible post-réponse et émet un clic avec la distance calculée. */
export interface PointMapInteractionProps {
  targetSvgPoint:  { x: number; y: number };
  onPointClick:    (result: { svgX: number; svgY: number; distanceKm: number }) => void;
  clickedSvgPoint: { x: number; y: number } | null;
  distanceKm:      number | null;
  answerState:     GameAnswerState;
}

/** Props injectées par le moteur dans tout composant de carte interactive.
 * Mode single : onSelect + selectedKey.
 * Mode multi  : onToggle + selectedKeys. */
export interface MapInteractionProps {
  onSelect?: (key: string) => void;
  onToggle?: (key: string) => void;
  selectedKey: string | null;
  selectedKeys: Set<string>;
  correctKeys: string[];
  answerState: GameAnswerState;
}

export interface GameChoice {
  key: string;
  label: ReactNode;
}

/** Sous-ensemble configurable par le module pour le champ de saisie libre.
 * Les props de contrôle (value, onChange, onSubmit, answerState) sont gérées par <GameEngine>. */
export interface GameInputConfig {
  variant?: 'number' | 'text' | 'time' | 'decompose';
  timeSeparator?: ':' | 'h';         // uniquement pour variant='time'
  decomposePositions?: string[];     // uniquement pour variant='decompose', ordre le plus haut → plus bas
  decomposeLabels?: Record<string, string>;   // labels affichés sous chaque champ de décomposition
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
    correctKey?:  (question: TQuestion) => string;        // single-select (existant)
    correctKeys?: (question: TQuestion) => string[];      // multi-select (nouveau)
    layout?: 'list' | 'grid';
  };
  free?: {
    parse: (raw: string) => unknown;
    isCorrect: (question: TQuestion, given: unknown) => boolean;
    /** Config du champ de saisie. Peut être statique ou une fonction par question. */
    inputProps?: GameInputConfig | ((question: TQuestion) => GameInputConfig);
    /** Retourne true si la saisie est suffisante pour valider (remplace le test `trim() !== ''`). */
    isReady?: (question: TQuestion, input: string) => boolean;
  };
  map?: {
    /** Retourne le composant à utiliser pour cette question.
     * DOIT renvoyer une référence stable (un composant défini au niveau module) : une
     * fonction créée ici serait un type de composant différent à chaque rendu, et React
     * démonterait puis remonterait toute la carte SVG à chaque changement d'état.
     * Ce qui varie d'une question à l'autre passe par `getComponentProps`. */
    getComponent: (question: TQuestion) => ComponentType<MapInteractionProps>;
    /** Props supplémentaires passées au composant, propres à la question. */
    getComponentProps?: (question: TQuestion) => Record<string, unknown>;
    isMapQuestion: (question: TQuestion) => boolean;
    /** true = multi-select (toggle), false = single-select. */
    isMultiSelect: (question: TQuestion) => boolean;
    correctKeys: (question: TQuestion) => string[];
    isCorrect: (question: TQuestion, clicked: string) => boolean;
  };
  pointMap?: {
    /** Même règle de stabilité que `map.getComponent`. */
    getComponent: (question: TQuestion) => ComponentType<PointMapInteractionProps>;
    getComponentProps?: (question: TQuestion) => Record<string, unknown>;
    isPointMapQuestion: (question: TQuestion) => boolean;
    targetSvgPoint: (question: TQuestion) => { x: number; y: number };
    isCorrect: (question: TQuestion, distanceKm: number) => boolean;
    feedbackLabel: (distanceKm: number) => string;
  };
  /** Contenu affiché avant la première question (ex : texte à lire en mode difficile).
   * Si null ou absent, la partie démarre directement. */
  preamble?: (session: TSession) => ReactNode | null;

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
 * `choices` statiques OU `loader` async (résolu par <ModulePreSetup> avant rendu).
 * `emptyMessage` affiché à la place de la liste vide quand `choices` est vide après résolution. */
export type SetupOption =
  | { key: string; type: 'single'; label: string; choices?: SetupChoice[]; loader?: () => Promise<SetupChoice[]>; emptyMessage?: string }
  | { key: string; type: 'multi'; label: string; choices?: SetupChoice[]; loader?: () => Promise<SetupChoice[]>; emptyMessage?: string };

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
