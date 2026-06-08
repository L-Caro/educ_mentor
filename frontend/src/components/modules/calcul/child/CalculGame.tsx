import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { startCalculSession, recordCalculAnswer, completeCalculSession } from 'src/api/calcul.api';
import type { CalculSessionResponse } from 'src/types';
import type { CalculHistoryEntry } from './CalculResult';
import PageContainer from 'src/components/layout/PageContainer/PageContainer';
import Button from 'src/components/common/Button';
import GameFooter from 'src/components/common/GameFooter';
import Spinner from 'src/components/common/Spinner';
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
  const inputRef = useRef<HTMLInputElement>(null);

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

  // Focus input à chaque nouvelle question
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [currentIdx, session]); // eslint-disable-line react-hooks/exhaustive-deps

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

  if (loading) {
    return (
      <PageContainer className="CalculGame">
        <div className="CalculGame__loading"><Spinner /></div>
      </PageContainer>
    );
  }

  if (error || !session || session.questions.length === 0) {
    return (
      <PageContainer className="CalculGame">
        <div className="CalculGame__error">
          <p>{error || 'Aucune question disponible.'}</p>
          <Button title="← Retour" onClick={() => navigate('/module/calcul-mental')} />
        </div>
      </PageContainer>
    );
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
      {!isUnlimited && (
        <div className="CalculGame__progressWrap">
          <div className="CalculGame__progressBar" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      {timerSeconds > 0 && (
        <div className="CalculGame__timerWrap">
          <div
            className={`CalculGame__timerBar${showUrgent ? ' CalculGame__timerBar--urgent' : ''}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
      )}

      <div className="CalculGame__scoreBar">
        <div className="CalculGame__stars">
          {'★'.repeat(filledStars)}{'☆'.repeat(5 - filledStars)}
        </div>
        {timerSeconds > 0 && (
          <div className={`CalculGame__timerChip${showUrgent ? ' CalculGame__timerChip--urgent' : ''}`}>
            ⏱ {Math.ceil(timeRemaining)}s
          </div>
        )}
        <div className="CalculGame__counter">{correctCount}/{answeredCount}</div>
      </div>

      <div className={`CalculGame__card${answerState === 'wrong' || answerState === 'timeout' ? ' CalculGame__card--shake' : ''}`}>
        {!isUnlimited && (
          <span className="CalculGame__questionTag">
            {currentIdx + 1} / {session.questions.length}
          </span>
        )}

        <p className="CalculGame__operation">
          {renderOperation(question.operation)}
        </p>

        <input
          ref={inputRef}
          type="tel"
          inputMode="numeric"
          pattern="[0-9]*"
          className={`CalculGame__input${
            answerState === 'correct' ? ' CalculGame__input--correct'
            : answerState === 'wrong' || answerState === 'timeout' ? ' CalculGame__input--wrong'
            : ''
          }`}
          value={answerState !== 'idle' ? (answerState === 'timeout' ? '' : inputValue) : inputValue}
          onChange={(event) => answerState === 'idle' && setInputValue(event.target.value.replace(/\D/g, ''))}
          onKeyDown={(event) => event.key === 'Enter' && handleValidate()}
          disabled={answerState !== 'idle'}
          placeholder="?"
          maxLength={3}
        />

        {(answerState === 'wrong' || answerState === 'timeout') && (
          <p className="CalculGame__correction">
            {answerState === 'timeout' ? '⏰ Trop tard ! ' : ''}
            La réponse était <strong>{question.answer}</strong>
          </p>
        )}
      </div>

      <GameFooter
        onTerminate={handleTerminate}
        onValidate={handleValidate}
        isValidateDisabled={answerState !== 'idle' || inputValue.trim() === ''}
      />
    </PageContainer>
  );
}
