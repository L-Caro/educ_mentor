import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startCalculSession, recordCalculAnswer, completeCalculSession } from 'src/api/calcul.api';
import type { CalculSessionResponse } from 'src/types';
import type { CalculHistoryEntry } from './CalculResult';
import PageContainer from 'src/components/layout/PageContainer/PageContainer';
import GameFooter from 'src/components/common/GameFooter';
import GameInput from 'src/components/common/GameInput';
import GameCorrection from 'src/components/common/GameCorrection';
import GameScoreBar from 'src/components/common/GameScoreBar';
import GameProgressBar from 'src/components/common/GameProgressBar';
import GameTimerBar from 'src/components/common/GameTimerBar';
import GameCard from 'src/components/common/GameCard';
import GamePrompt from 'src/components/common/GamePrompt';
import GameStateView from 'src/components/common/GameStateView';
import { useGameSession } from 'src/hook';

function renderOperation(operation: string) {
  const parts = operation.split('?');
  if (parts.length !== 2) return <>{operation}</>;
  return (
    <>{parts[0]}<span className="CalculGame__blank">?</span>{parts[1]}</>
  );
}

export default function CalculGame() {
  const navigate = useNavigate();

  const [inputValue, setInputValue] = useState('');

  const {
    loading, error,
    session, currentIdx, answerState, correctCount,
    timeRemaining, timerPct, isUrgent,
    submitAnswer, handleTerminate,
  } = useGameSession<CalculSessionResponse, CalculSessionResponse['questions'][number], CalculHistoryEntry>({
    loader: () => startCalculSession(),
    homePath: '/module/calcul-mental',
    resultsPath: '/module/calcul-mental/result',
    getQuestions: (session) => session.questions,
    getSessionId: (session) => session.session_id,
    getTimerSeconds: (session) => session.timer_seconds,
    onComplete: (sessionId, correctCount, total) => completeCalculSession(sessionId, correctCount, total),
    buildResultsState: (correctCount, total, history) => ({ correctCount, total, history }),
    buildTimeoutResult: (question) => ({
      operation: question.operation,
      answer: question.answer,
      given: null,
      correct: false,
      timeout: true,
    }),
    recordTimeout: (sessionId, question) => recordCalculAnswer(sessionId, question.answer, false),
    onQuestionChange: () => setInputValue(''),
  });

  function handleValidate() {
    if (!session || answerState !== 'idle' || inputValue.trim() === '') return;

    const question = session.questions[currentIdx];
    const given = parseInt(inputValue.trim(), 10);
    const correct = !isNaN(given) && given === question.answer;

    submitAnswer(
      correct,
      { operation: question.operation, answer: question.answer, given, correct, timeout: false },
      () => recordCalculAnswer(session.session_id, question.answer, correct),
    );
  }

  if (loading) return <GameStateView loading onBack={() => navigate('/module/calcul-mental')} />;

  if (error || !session || session.questions.length === 0) {
    return <GameStateView errorMessage={error || 'Aucune question disponible.'} onBack={() => navigate('/module/calcul-mental')} />;
  }

  const question = session.questions[currentIdx];
  const timerSeconds = session.timer_seconds;
  const isUnlimited = session.is_unlimited;
  const answeredCount = currentIdx + (answerState !== 'idle' ? 1 : 0);
  const filledStars = Math.min(5, answeredCount === 0 ? 0 : Math.floor((correctCount / answeredCount) * 5));
  const progressPct = isUnlimited ? 0 : (currentIdx / session.questions.length) * 100;
  const showUrgent = isUrgent && answerState === 'idle';

  return (
    <PageContainer className="CalculGame">
      {!isUnlimited && <GameProgressBar progress={progressPct} />}

      {timerSeconds > 0 && <GameTimerBar timerPct={timerPct} isUrgent={showUrgent} />}

      <GameScoreBar
        filledStars={filledStars}
        correctCount={correctCount}
        total={answeredCount}
        timeRemaining={timerSeconds > 0 ? timeRemaining : null}
        isUrgent={showUrgent}
      />

      <GameCard shake={answerState === 'wrong' || answerState === 'timeout'}>
        {!isUnlimited && (
          <span className="CalculGame__questionTag">
            {currentIdx + 1} / {session.questions.length}
          </span>
        )}

        <GamePrompt>
          <p className="CalculGame__operation">
            {renderOperation(question.operation)}
          </p>
        </GamePrompt>

        <GameInput
          value={answerState === 'timeout' ? '' : inputValue}
          onChange={setInputValue}
          onSubmit={handleValidate}
          answerState={answerState}
          numeric
          maxLength={3}
          placeholder="?"
          focusKey={currentIdx}
        />

        <GameCorrection answerState={answerState} answer={question.answer} />
      </GameCard>

      <GameFooter
        onTerminate={handleTerminate}
        onValidate={handleValidate}
        isValidateDisabled={answerState !== 'idle' || inputValue.trim() === ''}
      />
    </PageContainer>
  );
}
