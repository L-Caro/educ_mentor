import { useEffect, useRef, useState } from 'react';
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

  const [preambleDone, setPreambleDone] = useState(!spec.preamble);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [freeInput, setFreeInput] = useState('');
  const [pointClick, setPointClick] = useState<{ svgX: number; svgY: number; distanceKm: number } | null>(null);
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
    onQuestionChange: () => { setSelectedKey(null); setSelectedKeys(new Set()); setFreeInput(''); setPointClick(null); },
    skipApiCalls: isDevMode,
    emptySessionError: spec.emptyError,
  });

  useEffect(() => {
    if (!preambleDone && spec.preamble && session && spec.preamble(session) === null) {
      setPreambleDone(true);
    }
  }, [preambleDone, session, spec.preamble]);

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
    const isMap = !!spec.map && spec.map.isMapQuestion(question);
    const isMapMulti = isMap && spec.map!.isMultiSelect(question);
    // Multi QCM si correctKeys est défini ET retourne des réponses pour cette question (per-question)
    const isMulti = !isMap && !!spec.qcm?.correctKeys && (spec.qcm.correctKeys!(question)?.length ?? 0) > 0;

    let correct: boolean;
    let given: unknown;

    const isPointMap = !!spec.pointMap && spec.pointMap.isPointMapQuestion(question);

    if (isPointMap) {
      if (!pointClick) return;
      correct = spec.pointMap!.isCorrect(question, pointClick.distanceKm);
      given = pointClick.distanceKm;
    } else if (isMapMulti) {
      if (selectedKeys.size === 0) return;
      const expected = new Set(spec.map!.correctKeys(question));
      given = [...selectedKeys];
      correct = expected.size === selectedKeys.size &&
                [...selectedKeys].every(k => expected.has(k));
    } else if (isMap) {
      if (selectedKey === null) return;
      given = selectedKey;
      correct = spec.map!.isCorrect(question, selectedKey);
    } else if (!isFree(question)) {
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
      if (spec.free.isReady && !spec.free.isReady(question, freeInput)) return;
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

  if (!preambleDone) {
    const preambleContent = spec.preamble!(session);
    if (preambleContent !== null) {
      return (
        <PageContainer className="GameEngine">
          <GameCard>{preambleContent}</GameCard>
          <GameFooter
            onTerminate={handleTerminate}
            onValidate={() => setPreambleDone(true)}
            isValidateDisabled={false}
            validateLabel="📖 J'ai lu, je commence !"
          />
        </PageContainer>
      );
    }
  }

  const questions = getQuestions(session);
  const question = questions[currentIdx];
  const isPointMap = !!spec.pointMap && spec.pointMap.isPointMapQuestion(question);
  const isMap = !isPointMap && !!spec.map && spec.map.isMapQuestion(question);
  const isMapMulti = isMap && spec.map!.isMultiSelect(question);
  const qcm = !isPointMap && !isMap && !isFree(question);
  // Per-question : multi QCM si correctKeys est défini ET retourne des réponses pour cette question
  const isMulti = !isMap && !isPointMap && !!spec.qcm?.correctKeys && (spec.qcm.correctKeys!(question)?.length ?? 0) > 0;
  const unlimited = (session as { is_unlimited?: boolean }).is_unlimited ?? false;
  const timerSeconds = getTimerSeconds(session);
  const total = questions.length;
  const progress = (currentIdx / total) * 100;
  const answeredCount = currentIdx + (answerState !== 'idle' ? 1 : 0);
  const filledStars = Math.min(5, answeredCount === 0 ? 0 : Math.floor((correctCount / answeredCount) * 5));
  const showUrgent = isUrgent && answerState === 'idle';
  const mapCorrectKeys = isMap ? spec.map!.correctKeys(question) : [];
  const MapComponent = isMap ? spec.map!.getComponent(question) : null;
  const PointMapComponent = isPointMap ? spec.pointMap!.getComponent(question) : null;
  const validateDisabled =
    answerState !== 'idle' || (
      isPointMap ? pointClick === null
      : isMapMulti ? selectedKeys.size === 0
      : isMap    ? selectedKey === null
      : qcm      ? (isMulti ? selectedKeys.size === 0 : selectedKey === null)
      : spec.free?.isReady ? !spec.free.isReady(question, freeInput) : freeInput.trim() === ''
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

        {isPointMap && PointMapComponent ? (
          <PointMapComponent
            targetSvgPoint={spec.pointMap!.targetSvgPoint(question)}
            onPointClick={(result) => { if (answerState === 'idle') setPointClick(result); }}
            clickedSvgPoint={pointClick ? { x: pointClick.svgX, y: pointClick.svgY } : null}
            distanceKm={answerState !== 'idle' ? pointClick?.distanceKm ?? null : null}
            answerState={answerState}
          />
        ) : isMap && MapComponent ? (
          <MapComponent
            onSelect={isMapMulti ? undefined : (key) => { if (answerState === 'idle') setSelectedKey(key); }}
            onToggle={isMapMulti ? (key) => { if (answerState === 'idle') handleToggleKey(key); } : undefined}
            selectedKey={selectedKey}
            selectedKeys={selectedKeys}
            correctKeys={mapCorrectKeys}
            answerState={answerState}
          />
        ) : qcm ? (
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
            {...(typeof spec.free?.inputProps === 'function'
              ? spec.free.inputProps(question)
              : (spec.free?.inputProps ?? {}))}
            value={answerState === 'timeout' ? '' : freeInput}
            onChange={setFreeInput}
            onSubmit={handleValidate}
            answerState={answerState}
            focusKey={currentIdx}
          />
        )}

        <GameCorrection
          answerState={answerState}
          answer={spec.correctionLabel(question)}
          message={isPointMap && pointClick
            ? <>Vous étiez à <strong>{Math.round(pointClick.distanceKm)} km</strong> de {spec.correctionLabel(question)}</>
            : undefined}
        />
      </GameCard>

      <GameFooter
        onTerminate={handleTerminate}
        onValidate={handleValidate}
        isValidateDisabled={validateDisabled}
      />
    </PageContainer>
  );
}
