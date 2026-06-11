import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuestionTimer } from 'src/hooks/useQuestionTimer';

export type GameAnswerState = 'idle' | 'correct' | 'wrong' | 'timeout';

interface UseGameSessionConfig<TSession, TQuestion, TResult> {
  loader: () => Promise<TSession>;
  homePath: string;
  resultsPath: string;
  getQuestions: (session: TSession) => TQuestion[];
  getSessionId: (session: TSession) => string;
  getTimerSeconds: (session: TSession) => number;
  onComplete: (sessionId: string, correctCount: number, total: number) => Promise<void>;
  buildResultsState: (correctCount: number, total: number, results: TResult[]) => object;
  buildTimeoutResult: (question: TQuestion) => TResult;
  recordTimeout: (sessionId: string, question: TQuestion) => Promise<void>;
  onQuestionChange?: () => void;
  skipApiCalls?: boolean;
  emptySessionError?: string;
}

/**
 * Centralise toute la logique commune aux modules de jeu : chargement de session,
 * timer, suivi des réponses et navigation vers les résultats.
 *
 * Chaque module reste responsable de sa validation (handleValidate), de son rendu
 * et de ses états locaux (input, selectedChoice). Il appelle submitAnswer() quand
 * il a calculé isCorrect.
 */
export function useGameSession<TSession, TQuestion, TResult>({
  loader,
  homePath,
  resultsPath,
  getQuestions,
  getSessionId,
  getTimerSeconds,
  onComplete,
  buildResultsState,
  buildTimeoutResult,
  recordTimeout,
  onQuestionChange,
  skipApiCalls = false,
  emptySessionError = 'Aucune question disponible.',
}: UseGameSessionConfig<TSession, TQuestion, TResult>) {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [session, setSession] = useState<TSession | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answerState, setAnswerState] = useState<GameAnswerState>('idle');
  const [correctCount, setCorrectCount] = useState(0);

  // Refs pour accéder aux valeurs fraîches depuis les closures setTimeout
  const sessionRef = useRef<TSession | null>(null);
  const currentIdxRef = useRef(0);
  const answerStateRef = useRef<GameAnswerState>('idle');
  const correctCountRef = useRef(0);
  const resultsRef = useRef<TResult[]>([]);
  // Ref sur le setTimeout d'avance automatique — permet son annulation depuis handleTerminate
  const pendingAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);
  useEffect(() => { answerStateRef.current = answerState; }, [answerState]);

  // Mis à jour à chaque render pour que les callbacks setTimeout accèdent toujours
  // aux valeurs fraîches (closures / batchs d'état) sans être recréés.
  const configRef = useRef({
    getQuestions, getSessionId, getTimerSeconds, onComplete,
    buildResultsState, buildTimeoutResult, recordTimeout,
    onQuestionChange, skipApiCalls, homePath, resultsPath,
  });
  useEffect(() => {
    configRef.current = {
      getQuestions, getSessionId, getTimerSeconds, onComplete,
      buildResultsState, buildTimeoutResult, recordTimeout,
      onQuestionChange, skipApiCalls, homePath, resultsPath,
    };
  });

  useEffect(() => {
    loader()
      .then((loadedSession) => {
        if (getQuestions(loadedSession).length === 0) setError(emptySessionError);
        setSession(loadedSession);
      })
      .catch(() => setError('Impossible de démarrer la session.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const { timeRemaining, timerPct, isUrgent, startTimer, stopTimer } = useQuestionTimer(
    session ? getTimerSeconds(session) : 0,
    handleTimeout,
  );

  // Démarre le timer à chaque nouvelle question, dès que la session est chargée
  useEffect(() => {
    if (!session) return;
    startTimer();
  }, [currentIdx, session]); // eslint-disable-line react-hooks/exhaustive-deps

  /** Appelé automatiquement par useQuestionTimer quand le temps est écoulé. */
  function handleTimeout() {
    const config = configRef.current;
    const currentSession = sessionRef.current;
    const idx = currentIdxRef.current;
    if (!currentSession) return;

    const timedOutQuestion = config.getQuestions(currentSession)[idx];
    const sessionId = config.getSessionId(currentSession);

    setAnswerState('timeout');
    answerStateRef.current = 'timeout';
    resultsRef.current = [...resultsRef.current, config.buildTimeoutResult(timedOutQuestion)];

    if (!config.skipApiCalls) {
      config.recordTimeout(sessionId, timedOutQuestion).catch(console.error);
    }

    pendingAdvanceRef.current = setTimeout(() => {
      pendingAdvanceRef.current = null;
      advance(currentSession, idx);
    }, 1600);
  }

  /** Passe à la question suivante ou navigue vers les résultats si c'était la dernière. */
  function advance(currentSession: TSession, idx: number) {
    const config = configRef.current;
    const totalQuestions = config.getQuestions(currentSession).length;

    if (idx + 1 >= totalQuestions) {
      const sessionId = config.getSessionId(currentSession);
      const finalCorrectCount = correctCountRef.current;
      const answeredTotal = resultsRef.current.length;

      if (!config.skipApiCalls) {
        config.onComplete(sessionId, finalCorrectCount, answeredTotal).catch(console.error);
      }

      navigate(config.resultsPath, {
        state: config.buildResultsState(finalCorrectCount, answeredTotal, resultsRef.current),
      });
    } else {
      setCurrentIdx(idx + 1);
      setAnswerState('idle');
      answerStateRef.current = 'idle';
      config.onQuestionChange?.();
    }
  }

  /**
   * Valide une réponse : met à jour l'état, enregistre le résultat et
   * déclenche l'avance automatique vers la question suivante.
   *
   * @param record - Fonction zéro-argument qui appelle l'API d'enregistrement.
   *                 N'est pas appelée si skipApiCalls est actif.
   */
  function submitAnswer(isCorrect: boolean, resultEntry: TResult, record: () => Promise<void>) {
    const currentSession = sessionRef.current;
    const idx = currentIdxRef.current;
    if (!currentSession || answerStateRef.current !== 'idle') return;

    stopTimer();

    const newState: GameAnswerState = isCorrect ? 'correct' : 'wrong';
    setAnswerState(newState);
    answerStateRef.current = newState;

    if (isCorrect) {
      correctCountRef.current++;
      setCorrectCount(correctCountRef.current);
    }

    resultsRef.current = [...resultsRef.current, resultEntry];

    if (!configRef.current.skipApiCalls) {
      record().catch(console.error);
    }

    pendingAdvanceRef.current = setTimeout(() => {
      pendingAdvanceRef.current = null;
      advance(currentSession, idx);
    }, isCorrect ? 900 : 1600);
  }

  async function handleTerminate() {
    const config = configRef.current;
    const currentSession = sessionRef.current;

    if (pendingAdvanceRef.current) {
      clearTimeout(pendingAdvanceRef.current);
      pendingAdvanceRef.current = null;
    }

    stopTimer();

    if (!currentSession || resultsRef.current.length === 0) {
      navigate(config.homePath);
      return;
    }

    const sessionId = config.getSessionId(currentSession);
    const finalCorrectCount = correctCountRef.current;
    const total = resultsRef.current.length;

    if (!config.skipApiCalls) {
      await config.onComplete(sessionId, finalCorrectCount, total).catch(console.error);
    }

    navigate(config.resultsPath, {
      state: config.buildResultsState(finalCorrectCount, total, resultsRef.current),
    });
  }

  return {
    loading,
    error,
    session,
    currentIdx,
    answerState,
    correctCount,
    timeRemaining,
    timerPct,
    isUrgent,
    submitAnswer,
    handleTerminate,
  };
}
