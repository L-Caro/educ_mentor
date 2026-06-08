import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  startCalculSession,
  recordCalculAnswer,
  completeCalculSession,
} from 'src/api/calcul.api';
import type { CalculSessionResponse } from 'src/types';
import type { CalculHistoryEntry } from './CalculResult';
import PageContainer from 'src/components/layout/PageContainer/PageContainer';
import Button from 'src/components/common/Button';
import Spinner from 'src/components/common/Spinner';
import { useQuestionTimer } from 'src/hook';

type AnswerState = 'idle' | 'correct' | 'wrong' | 'timeout';

function renderOperation(op: string) {
  const parts = op.split('?');
  if (parts.length !== 2) return <>{op}</>;
  return (
    <>{parts[0]}<span className="CalculGame__blank">?</span>{parts[1]}</>
  );
}

export default function CalculGame() {
  const navigate = useNavigate();
  const [session, setSession] = useState<CalculSessionResponse | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [correctCount, setCorrectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const answerStateRef = useRef<AnswerState>('idle');
  const correctCountRef = useRef(0);
  const historyRef = useRef<CalculHistoryEntry[]>([]);
  const sessionRef = useRef<CalculSessionResponse | null>(null);
  const currentIdxRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const { timeRemaining, timerPct, isUrgent, startTimer, stopTimer } = useQuestionTimer(
    session?.timer_seconds ?? 0,
    handleTimeout,
  );

  useEffect(() => { answerStateRef.current = answerState; }, [answerState]);
  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);

  useEffect(() => {
    startCalculSession()
      .then((s) => setSession(s))
      .catch(() => setError('Impossible de démarrer la session.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Démarre le timer + focus input à chaque nouvelle question
  useEffect(() => {
    if (!session) return;
    startTimer();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [currentIdx, session?.session_id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTimeout() {
    const currentSession = sessionRef.current;
    const idx = currentIdxRef.current;
    if (!currentSession) return;
    const timedOutQuestion = currentSession.questions[idx];
    setAnswerState('timeout');
    historyRef.current.push({ operation: timedOutQuestion.operation, answer: timedOutQuestion.answer, given: null, correct: false, timeout: true });
    recordCalculAnswer(currentSession.session_id, timedOutQuestion.answer, false).catch(console.error);
    setTimeout(() => advance(currentSession, idx), 1600);
  }

  async function handleValidate() {
    if (answerStateRef.current !== 'idle' || !session || inputValue.trim() === '') return;
    stopTimer();

    const currentQuestion = session.questions[currentIdx];
    const given = parseInt(inputValue.trim(), 10);
    const correct = !isNaN(given) && given === currentQuestion.answer;

    setAnswerState(correct ? 'correct' : 'wrong');
    if (correct) {
      correctCountRef.current++;
      setCorrectCount(correctCountRef.current);
    }
    historyRef.current.push({ operation: currentQuestion.operation, answer: currentQuestion.answer, given, correct, timeout: false });

    recordCalculAnswer(session.session_id, currentQuestion.answer, correct).catch(console.error);

    setTimeout(() => advance(session, currentIdx), correct ? 900 : 1600);
  }

  function advance(s: CalculSessionResponse, idx: number) {
    if (idx + 1 >= s.questions.length) {
      finishSession(s);
    } else {
      setCurrentIdx(idx + 1);
      setInputValue('');
      setAnswerState('idle');
    }
  }

  async function finishSession(s: CalculSessionResponse) {
    await completeCalculSession(s.session_id, correctCountRef.current, historyRef.current.length).catch(console.error);
    navigate('/module/calcul-mental/result', {
      state: { correctCount: correctCountRef.current, total: historyRef.current.length, history: historyRef.current },
    });
  }

  async function handleTerminate() {
    stopTimer();
    const s = sessionRef.current;
    if (!s || historyRef.current.length === 0) {
      navigate('/module/calcul-mental');
      return;
    }
    await completeCalculSession(s.session_id, correctCountRef.current, historyRef.current.length).catch(console.error);
    navigate('/module/calcul-mental/result', {
      state: { correctCount: correctCountRef.current, total: historyRef.current.length, history: historyRef.current },
    });
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
      {/* Barre de progression (mode limité) */}
      {!isUnlimited && (
        <div className="CalculGame__progressWrap">
          <div className="CalculGame__progressBar" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      {/* Barre de timer */}
      {timerSeconds > 0 && (
        <div className="CalculGame__timerWrap">
          <div
            className={`CalculGame__timerBar${showUrgent ? ' CalculGame__timerBar--urgent' : ''}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
      )}

      {/* Score bar */}
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

      {/* Carte opération */}
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

      {/* Actions */}
      <div className="CalculGame__actions">
        {answerState === 'idle' && (
          <Button
            title="✓ Valider"
            onClick={handleValidate}
            disabled={inputValue.trim() === ''}
          />
        )}
        <button className="CalculGame__btnTerminer" onClick={handleTerminate}>
          Terminer
        </button>
      </div>
    </PageContainer>
  );
}
