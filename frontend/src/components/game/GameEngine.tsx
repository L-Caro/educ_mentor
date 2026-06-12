import { useRef, useState, type ReactNode, type ComponentProps } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevMode, useGameSession, useAppSelector } from 'src/hooks';
import type { GameAnswerState } from 'src/hooks';
import { selectModuleSetup, type ModuleSetup } from 'src/store/slice/gameSetupSlice.ts';
import PageContainer from 'src/components/layout/PageContainer/PageContainer.tsx';
import GameFooter from './GameFooter.tsx';
import GameChoices from './GameChoices.tsx';
import GameInput from './GameInput.tsx';
import GameCorrection from './GameCorrection.tsx';
import GameScoreBar from './GameScoreBar.tsx';
import GameProgressBar from './GameProgressBar.tsx';
import GameTimerBar from './GameTimerBar.tsx';
import GameCard from './GameCard.tsx';
import GameStateView from './GameStateView.tsx';
import DevBadge from 'src/components/common/DevBadge.tsx';
import type { GameResultEntry } from './GameResult.ts';

export interface GameChoice {
  key: string;
  label: ReactNode;
}

/**
 * Contrat d'un module de jeu « question → réponse ». Le module ne déclare que SES
 * différences ; `<GameEngine>` fournit tout le squelette commun (timer, score, étoiles,
 * progression, dev mode, navigation). Le mode (QCM vs saisie libre) est dérivé de la
 * présence de choix sur la question.
 */
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
    inputProps?: Partial<ComponentProps<typeof GameInput>>;
  };
  correctionLabel: (question: TQuestion) => ReactNode;

  recordAnswer: (sessionId: string, question: TQuestion, correct: boolean, given: unknown) => Promise<void>;
  completeSession: (sessionId: string, correct: number, total: number) => Promise<void>;
  buildResultEntry: (question: TQuestion, given: unknown, correct: boolean, timeout: boolean) => GameResultEntry;

  emptyError?: string;
  showStreak?: boolean;
  showQuestionTag?: boolean;
}

interface GameEngineProps<TSession, TQuestion> {
  spec: GameModuleSpec<TSession, TQuestion>;
  moduleId: string;
}

export default function GameEngine<TSession, TQuestion>({
  spec,
  moduleId,
}: GameEngineProps<TSession, TQuestion>) {
  const navigate = useNavigate();
  const { isDevMode } = useDevMode();
  const setup = useAppSelector(selectModuleSetup(moduleId)) ?? {};

  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [freeInput, setFreeInput] = useState('');
  const [streak, setStreak] = useState(0);
  const streakRef = useRef(0);

  const homePath = `/module/${moduleId}`;
  const resultsPath = `/module/${moduleId}/result`;

  const getQuestions = spec.getQuestions ?? ((session: TSession) => (session as { questions: TQuestion[] }).questions);
  const getSessionId = spec.getSessionId ?? ((session: TSession) => (session as { session_id: string }).session_id);
  const getTimerSeconds = spec.getTimerSeconds ?? ((session: TSession) => (session as { timer_seconds: number }).timer_seconds);

  const {
    loading, error, session, currentIdx, answerState, correctCount,
    timeRemaining, timerPct, isUrgent, submitAnswer, handleTerminate,
  } = useGameSession<TSession, TQuestion, GameResultEntry>({
    loader: () => spec.loadSession(setup),
    homePath,
    resultsPath,
    getQuestions,
    getSessionId,
    getTimerSeconds,
    onComplete: (sessionId, correct, total) => spec.completeSession(sessionId, correct, total),
    buildResultsState: (correct, total, results) => ({ correctCount: correct, total, results }),
    buildTimeoutResult: (question) => spec.buildResultEntry(question, null, false, true),
    recordTimeout: (sessionId, question) => spec.recordAnswer(sessionId, question, false, null),
    onQuestionChange: () => { setSelectedKey(null); setFreeInput(''); },
    skipApiCalls: isDevMode,
    emptySessionError: spec.emptyError,
  });

  // Mode dérivé des seuls choix : aucun choix = saisie libre, sinon QCM.
  function isFree(question: TQuestion): boolean {
    return !spec.qcm || spec.qcm.getChoices(question).length === 0;
  }

  function handleValidate() {
    if (!session || answerState !== 'idle') return;
    const question = getQuestions(session)[currentIdx];

    let correct: boolean;
    let given: unknown;

    if (!isFree(question)) {
      if (selectedKey === null) return;
      given = selectedKey;
      correct = selectedKey === spec.qcm!.correctKey(question);
    } else {
      if (!spec.free || freeInput.trim() === '') return;
      given = spec.free.parse(freeInput);
      correct = spec.free.isCorrect(question, given);
    }

    if (correct) { streakRef.current++; setStreak(streakRef.current); }
    else { streakRef.current = 0; setStreak(0); }

    submitAnswer(
      correct,
      spec.buildResultEntry(question, given, correct, false),
      () => spec.recordAnswer(getSessionId(session), question, correct, given),
    );
  }

  if (loading) return <GameStateView loading onBack={() => navigate(homePath)} />;

  if (error || !session || getQuestions(session).length === 0) {
    return <GameStateView errorMessage={error || spec.emptyError || 'Aucune question disponible.'} onBack={() => navigate(homePath)} />;
  }

  const questions = getQuestions(session);
  const question = questions[currentIdx];
  const qcm = !isFree(question);
  const unlimited = (session as { is_unlimited?: boolean }).is_unlimited ?? false;
  const timerSeconds = getTimerSeconds(session);
  const total = questions.length;
  const progress = (currentIdx / total) * 100;
  const answeredCount = currentIdx + (answerState !== 'idle' ? 1 : 0);
  const filledStars = Math.min(5, answeredCount === 0 ? 0 : Math.floor((correctCount / answeredCount) * 5));
  const showUrgent = isUrgent && answerState === 'idle';
  const validateDisabled =
    answerState !== 'idle' || (qcm ? selectedKey === null : freeInput.trim() === '');

  return (
    <PageContainer className="GameEngine">
      {isDevMode && <DevBadge />}

      {!unlimited && <GameProgressBar progress={progress} />}

      {timerSeconds > 0 && <GameTimerBar timerPct={timerPct} isUrgent={showUrgent} />}

      <GameScoreBar
        filledStars={filledStars}
        correctCount={correctCount}
        total={unlimited ? answeredCount : total}
        timeRemaining={timerSeconds > 0 ? timeRemaining : null}
        isUrgent={showUrgent}
        streak={spec.showStreak ? streak : undefined}
      />

      <GameCard shake={answerState === 'wrong' || answerState === 'timeout'}>
        {spec.showQuestionTag && !unlimited && (
          <span className="GameEngine__questionTag">Question {currentIdx + 1} / {total}</span>
        )}

        {spec.renderPrompt(question, answerState)}

        {qcm ? (
          <GameChoices
            options={spec.qcm!.getChoices(question)}
            selectedKey={selectedKey}
            correctKey={spec.qcm!.correctKey(question)}
            answerState={answerState}
            onSelect={setSelectedKey}
          />
        ) : (
          <GameInput
            {...(spec.free?.inputProps ?? {})}
            value={answerState === 'timeout' ? '' : freeInput}
            onChange={setFreeInput}
            onSubmit={handleValidate}
            answerState={answerState}
            focusKey={currentIdx}
          />
        )}

        <GameCorrection answerState={answerState} answer={spec.correctionLabel(question)} />
      </GameCard>

      <GameFooter
        onTerminate={handleTerminate}
        onValidate={handleValidate}
        isValidateDisabled={validateDisabled}
      />
    </PageContainer>
  );
}
