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
import Fiche from 'src/components/common/Fiche/Fiche.tsx';

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

  const [preambleDismissed, setPreambleDismissed] = useState(false);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [selectedKeys, setSelectedKeys] = useState<Set<string>>(new Set());
  const [freeInput, setFreeInput] = useState('');
  const [pointClick, setPointClick] = useState<{ svgX: number; svgY: number; distanceKm: number } | null>(null);
  const [streak, setStreak] = useState(0);
  const [ficheOpen, setFicheOpen] = useState(false);
  const streakRef = useRef(0);

  const homePath = `/module/${moduleId}`;
  const resultsPath = `/module/${moduleId}/result`;

  const getQuestions = spec.getQuestions ?? ((session: TSession) => (session as { questions: TQuestion[] }).questions);
  const getSessionId = spec.getSessionId ?? ((session: TSession) => (session as { session_id: string }).session_id);
  const getTimerSeconds = spec.getTimerSeconds ?? ((session: TSession) => (session as { timer_seconds: number }).timer_seconds);

  const {
    loading, error, session, currentIdx, answerState, correctCount,
    timeRemaining, timerPct, isUrgent, submitAnswer, advanceNow, handleTerminate,
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
    onQuestionChange: () => { setSelectedKey(null); setSelectedKeys(new Set()); setFreeInput(''); setPointClick(null); setFicheOpen(false); },
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
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
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

    // Sur une erreur, si le module sait expliquer, on suspend l'avance automatique :
    // 1600 ms ne laissent pas le temps de repérer un bouton. La main revient à l'enfant.
    // Sur une bonne réponse, rien ne change — on n'interrompt pas une série.
    const explains = !correct && spec.fiche?.(question) != null;

    submitAnswer(
      correct,
      spec.buildResultEntry(question, given, correct, false),
      () => spec.recordAnswer(getSessionId(session), question, correct, given),
      { hold: explains },
    );
  }

  if (loading) return <GameStateView loading onBack={() => navigate(homePath)} />;

  if (error || !session || getQuestions(session).length === 0) {
    return <GameStateView errorMessage={error || spec.emptyError || 'Aucune question disponible.'} onBack={() => navigate(homePath)} />;
  }

  // Le préambule est DÉRIVÉ, pas synchronisé : un module peut n'en avoir aucun, ou en
  // retourner un vide selon la session. L'ancien `useEffect` + `setState` provoquait un
  // rendu supplémentaire systématique à chaque chargement de partie.
  const preambleContent = !preambleDismissed && spec.preamble ? spec.preamble(session) : null;

  if (preambleContent !== null) {
    return (
      <PageContainer className="GameEngine">
        <GameCard>{preambleContent}</GameCard>
        <GameFooter
          onTerminate={handleTerminate}
          onValidate={() => setPreambleDismissed(true)}
          isValidateDisabled={false}
          validateLabel="📖 J'ai lu, je commence"
        />
      </PageContainer>
    );
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
  // La stabilité de ces composants est une clause du contrat, documentée sur
  // `map.getComponent` / `pointMap.getComponent` dans game.types.ts : ils doivent être définis
  // au niveau module. ESLint ne peut pas le vérifier à travers l'indirection du spec — il voit
  // seulement un appel de fonction renvoyant un composant — d'où ces dérogations ciblées.
  // La règle reste active partout ailleurs, et c'est elle qui avait révélé le problème réel :
  // geo et france renvoyaient une closure, donc un type de composant neuf à chaque rendu, et
  // React reconstruisait la carte SVG entière à chaque clic.
  const MapComponent = isMap ? spec.map!.getComponent(question) : null;
  const mapExtraProps = isMap ? (spec.map!.getComponentProps?.(question) ?? {}) : {};
  const PointMapComponent = isPointMap ? spec.pointMap!.getComponent(question) : null;
  const pointMapExtraProps = isPointMap ? (spec.pointMap!.getComponentProps?.(question) ?? {}) : {};
  // Proposée seulement après une erreur : c'est le moment où l'enfant veut savoir pourquoi.
  const fiche = answerState === 'wrong' || answerState === 'timeout'
    ? spec.fiche?.(question) ?? null
    : null;

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
          // eslint-disable-next-line react-hooks/static-components -- cf. commentaire sur MapComponent
          <PointMapComponent
            {...pointMapExtraProps}
            targetSvgPoint={spec.pointMap!.targetSvgPoint(question)}
            onPointClick={(result) => { if (answerState === 'idle') setPointClick(result); }}
            clickedSvgPoint={pointClick ? { x: pointClick.svgX, y: pointClick.svgY } : null}
            distanceKm={answerState !== 'idle' ? pointClick?.distanceKm ?? null : null}
            answerState={answerState}
          />
        ) : isMap && MapComponent ? (
          // eslint-disable-next-line react-hooks/static-components -- cf. commentaire sur MapComponent
          <MapComponent
            {...mapExtraProps}
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

      {fiche && ficheOpen ? (
        <Fiche fiche={fiche} onClose={() => { setFicheOpen(false); advanceNow(); }} />
      ) : (
        <GameFooter
          onTerminate={handleTerminate}
          onValidate={fiche ? advanceNow : handleValidate}
          isValidateDisabled={fiche ? false : validateDisabled}
          validateLabel={fiche ? 'Suivant →' : undefined}
          secondaryLabel={fiche ? '📘 Pourquoi ?' : undefined}
          onSecondary={fiche ? () => setFicheOpen(true) : undefined}
        />
      )}
    </PageContainer>
  );
}
