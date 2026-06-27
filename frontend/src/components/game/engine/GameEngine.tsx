import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDevMode, useGameSession, useAppSelector } from 'src/hooks';
import { selectModuleSetup } from 'src/store/slice/gameSetupSlice.ts';
import type { GameModuleSpec } from 'src/types/game.types.ts';
import PageContainer from 'src/components/layout/PageContainer/PageContainer.tsx';
import GameFooter from './components/GameFooter.tsx';
import GameChoices from './components/GameChoices.tsx';
import GameInput from './components/GameInput.tsx';
import GameCorrection from './components/GameCorrection.tsx';
import GameScoreBar from './components/GameScoreBar.tsx';
import GameProgressBar from './components/GameProgressBar.tsx';
import GameTimerBar from './components/GameTimerBar.tsx';
import GameCard from './components/GameCard.tsx';
import GameStateView from './GameStateView.tsx';
import DevBadge from 'src/components/common/DevBadge.tsx';

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
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
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
  } = useGameSession<TSession, TQuestion>({
    loader: () => spec.loadSession(setup),
    homePath,
    resultsPath,
    getQuestions,
    getSessionId,
    getTimerSeconds,
    onComplete: (sessionId, correct, total) => spec.completeSession(sessionId, correct, total),
    buildTimeoutResult: (question) => spec.buildResultEntry(question, null, false, true),
    recordTimeout: (sessionId, question) => spec.recordAnswer(sessionId, question, false, null),
    onQuestionChange: () => { setSelectedKey(null); setSelectedKeys(new Set()); setFreeInput(''); },
    skipApiCalls: isDevMode,
    emptySessionError: spec.emptyError,
  });

  // Mode dérivé des seuls choix : aucun choix = saisie libre, sinon QCM.
  function isFree(question: TQuestion): boolean {
    return !spec.qcm || spec.qcm.getChoices(question).length === 0;
  }

  function handleToggleKey(key: string) {
    setSelectedKeys(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  function handleValidate() {
    if (!session || answerState !== 'idle') return;
    const question = getQuestions(session)[currentIdx];
    // Multi si correctKeys est défini ET retourne des réponses pour cette question (per-question)
    const isMulti = !!spec.qcm?.correctKeys && (spec.qcm.correctKeys!(question)?.length ?? 0) > 0;

    let correct: boolean;
    let given: unknown;

    if (!isFree(question)) {
      if (isMulti) {
        if (selectedKeys.size === 0) return;
        const expected = new Set(spec.qcm!.correctKeys!(question));
        correct = expected.size === selectedKeys.size &&
                  [...selectedKeys].every(k => expected.has(k));
        given = [...selectedKeys];
      } else {
        if (selectedKey === null) return;
        given = selectedKey;
        correct = selectedKey === spec.qcm!.correctKey!(question);
      }
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
  // Per-question : multi si correctKeys est défini ET retourne des réponses pour cette question
  const isMulti = !!spec.qcm?.correctKeys && (spec.qcm.correctKeys!(question)?.length ?? 0) > 0;
  const unlimited = (session as { is_unlimited?: boolean }).is_unlimited ?? false;
  const timerSeconds = getTimerSeconds(session);
  const total = questions.length;
  const progress = (currentIdx / total) * 100;
  const answeredCount = currentIdx + (answerState !== 'idle' ? 1 : 0);
  const filledStars = Math.min(5, answeredCount === 0 ? 0 : Math.floor((correctCount / answeredCount) * 5));
  const showUrgent = isUrgent && answerState === 'idle';
  const validateDisabled =
    answerState !== 'idle' || (
      qcm
        ? (isMulti ? selectedKeys.size === 0 : selectedKey === null)
        : freeInput.trim() === ''
    );

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
          isMulti ? (
            <GameChoices
              options={spec.qcm!.getChoices(question)}
              selectedKeys={selectedKeys}
              correctKeys={spec.qcm!.correctKeys!(question)}
              onToggle={handleToggleKey}
              answerState={answerState}
              layout={spec.qcm!.layout}
            />
          ) : (
            <GameChoices
              options={spec.qcm!.getChoices(question)}
              selectedKey={selectedKey}
              correctKey={spec.qcm!.correctKey!(question)}
              onSelect={setSelectedKey}
              answerState={answerState}
              layout={spec.qcm!.layout}
            />
          )
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
