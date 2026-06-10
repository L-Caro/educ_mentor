import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startTablesSession, recordTablesAnswer, completeTablesSession } from 'src/api/module/tables.api.ts';
import type { TablesQuestion, TablesSessionResponse } from 'src/types';
import PageContainer from 'src/components/layout/PageContainer/PageContainer';
import GameFooter from 'src/components/common/Game/GameFooter.tsx';
import GameChoices from 'src/components/common/Game/GameChoices.tsx';
import GameInput from 'src/components/common/Game/GameInput.tsx';
import GameCorrection from 'src/components/common/Game/GameCorrection.tsx';
import GameScoreBar from 'src/components/common/Game/GameScoreBar.tsx';
import GameProgressBar from 'src/components/common/Game/GameProgressBar.tsx';
import GameTimerBar from 'src/components/common/Game/GameTimerBar.tsx';
import GameCard from 'src/components/common/Game/GameCard.tsx';
import GamePrompt from 'src/components/common/Game/GamePrompt.tsx';
import GameStateView from 'src/components/common/Game/GameStateView.tsx';
import { useDevMode, useGameSession, useAppSelector } from 'src/hook';
import { selectModuleSetup } from 'src/store/slice/gameSetupSlice';
import DevBadge from 'src/components/common/DevBadge';

type TablesResult = { question: TablesQuestion; wasCorrect: boolean };

export default function TablesGame() {
  const navigate = useNavigate();
  const { isDevMode } = useDevMode();
  const setup = useAppSelector(selectModuleSetup('tables'));

  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [freeInput, setFreeInput] = useState('');
  const [streak, setStreak] = useState(0);
  const streakRef = useRef(0);

  // Choix éphémère (tables) depuis le slice ; nombre/mode de réponse/trivial sont lus côté back.
  const tables = (setup?.tables as string[] | undefined)?.map(Number).filter((n) => !isNaN(n)) ?? [];

  const {
    loading, error,
    session, currentIdx, answerState, correctCount,
    timeRemaining, timerPct, isUrgent,
    submitAnswer, handleTerminate,
  } = useGameSession<TablesSessionResponse, TablesQuestion, TablesResult>({
    loader: () => startTablesSession(tables),
    homePath: '/module/tables',
    resultsPath: '/module/tables/result',
    getQuestions: (session) => session.questions,
    getSessionId: (session) => session.session_id,
    getTimerSeconds: (session) => session.timer_seconds,
    onComplete: (sessionId, correctCount, total) => completeTablesSession(sessionId, correctCount, total),
    buildResultsState: (correctCount, total, results) => ({ correctCount, total, results }),
    buildTimeoutResult: (question) => ({ question, wasCorrect: false }),
    recordTimeout: (sessionId, question) => recordTablesAnswer(sessionId, question.display_a, question.display_b, false),
    onQuestionChange: () => { setSelectedChoice(null); setFreeInput(''); },
    skipApiCalls: isDevMode,
    emptySessionError: 'Aucune question disponible. Sélectionne au moins une table.',
  });

  function handleValidate() {
    if (!session || answerState !== 'idle') return;
    const question = session.questions[currentIdx];
    const isFreeMode = question.choices.length === 0;
    let isCorrect: boolean;

    if (isFreeMode) {
      const parsed = parseInt(freeInput.trim(), 10);
      isCorrect = !isNaN(parsed) && parsed === question.answer;
    } else {
      if (selectedChoice === null) return;
      isCorrect = selectedChoice === question.answer;
    }

    if (isCorrect) { streakRef.current++; setStreak(streakRef.current); }
    else { streakRef.current = 0; setStreak(0); }

    submitAnswer(
      isCorrect,
      { question, wasCorrect: isCorrect },
      () => recordTablesAnswer(session.session_id, question.display_a, question.display_b, isCorrect),
    );
  }

  if (loading) return <GameStateView loading onBack={() => navigate('/module/tables')} />;

  if (error || !session || session.questions.length === 0) {
    return <GameStateView errorMessage={error || 'Aucune question disponible.'} onBack={() => navigate('/module/tables')} />;
  }

  const question = session.questions[currentIdx];
  const isFreeMode = question.choices.length === 0;
  const timerSeconds = session.timer_seconds;
  const total = session.questions.length;
  const progress = (currentIdx / total) * 100;
  const filledStars = Math.min(5, Math.floor(correctCount / Math.max(1, total / 5)));
  const showUrgent = isUrgent && answerState === 'idle';

  return (
    <PageContainer className="TablesGame">
      {isDevMode && <DevBadge />}

      <GameProgressBar progress={progress} />

      {timerSeconds > 0 && <GameTimerBar timerPct={timerPct} isUrgent={showUrgent} />}

      <GameScoreBar
        filledStars={filledStars}
        correctCount={correctCount}
        total={total}
        timeRemaining={timerSeconds > 0 ? timeRemaining : null}
        isUrgent={showUrgent}
        streak={streak}
      />

      <GameCard shake={answerState === 'wrong' || answerState === 'timeout'}>
        <span className="TablesGame__questionTag">Question {currentIdx + 1} / {total}</span>
        <GamePrompt>
          <p className="TablesGame__question">
            {question.display_a} × {question.display_b} = ?
          </p>
        </GamePrompt>

        {isFreeMode ? (
          <GameInput
            value={answerState === 'timeout' ? '' : freeInput}
            onChange={setFreeInput}
            onSubmit={handleValidate}
            answerState={answerState}
            numeric
            maxLength={3}
            placeholder="?"
            focusKey={currentIdx}
          />
        ) : (
          <GameChoices
            options={question.choices.map((choice) => ({ key: String(choice), label: choice }))}
            selectedKey={selectedChoice === null ? null : String(selectedChoice)}
            correctKey={String(question.answer)}
            answerState={answerState}
            onSelect={(key) => setSelectedChoice(Number(key))}
          />
        )}

        <GameCorrection answerState={answerState} answer={question.answer} />
      </GameCard>

      <GameFooter
        onTerminate={handleTerminate}
        onValidate={handleValidate}
        isValidateDisabled={answerState !== 'idle' || (isFreeMode ? freeInput.trim() === '' : selectedChoice === null)}
      />
    </PageContainer>
  );
}
