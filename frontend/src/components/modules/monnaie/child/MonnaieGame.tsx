import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  startMonnaieSession,
  recordMonnaieAnswer,
  completeMonnaieSession,
} from 'src/api/monnaie.api';
import type { MonnaieSessionResponse, MonnaieQuestion, MonnaieExerciseType } from 'src/types';
import type { MonnaieHistoryEntry } from './MonnaieResult';
import { formatCents, getMonnaieImageUrl, parseMoneyInput } from '../constants/denominations';
import PageContainer from 'src/components/layout/PageContainer/PageContainer';
import Button from 'src/components/common/Button';
import Spinner from 'src/components/common/Spinner';
import { useQuestionTimer } from 'src/hook';

type AnswerState = 'idle' | 'correct' | 'wrong' | 'timeout';

const EXERCISE_PROMPTS: Record<MonnaieExerciseType, string> = {
  reconnaitre: 'Combien y a-t-il en tout ?',
  total: 'Quel est le total à payer ?',
  rendre: 'Combien rend-on ?',
};

function renderQuestion(question: MonnaieQuestion) {
  switch (question.type) {
    case 'reconnaitre':
      return (
        <div className="MonnaieGame__coins">
          {(question.coins ?? []).map((coin, coinIndex) => (
            <img
              key={coinIndex}
              src={getMonnaieImageUrl(coin)}
              alt={formatCents(coin)}
              className={`MonnaieGame__coin${coin >= 500 ? ' MonnaieGame__coin--billet' : ''}`}
            />
          ))}
        </div>
      );
    case 'total':
      return (
        <div className="MonnaieGame__prices">
          {(question.prices ?? []).map((price, priceIndex) => (
            <span key={priceIndex} className="MonnaieGame__priceTag">
              {formatCents(price)}
            </span>
          ))}
        </div>
      );
    case 'rendre':
      return (
        <div className="MonnaieGame__scenario">
          <div className="MonnaieGame__scenarioLine">
            <span className="MonnaieGame__scenarioLabel">Article</span>
            <span className="MonnaieGame__scenarioValue">{formatCents(question.price ?? 0)}</span>
          </div>
          <div className="MonnaieGame__scenarioLine">
            <span className="MonnaieGame__scenarioLabel">Tu donnes</span>
            <span className="MonnaieGame__scenarioValue">{formatCents(question.payment ?? 0)}</span>
          </div>
        </div>
      );
  }
}

export default function MonnaieGame() {
  const navigate = useNavigate();
  const location = useLocation();
  const exerciseType = (location.state as { exerciseType?: MonnaieExerciseType } | null)?.exerciseType;

  const [session, setSession] = useState<MonnaieSessionResponse | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [inputValue, setInputValue] = useState('');
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [correctCount, setCorrectCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const answerStateRef = useRef<AnswerState>('idle');
  const correctCountRef = useRef(0);
  const historyRef = useRef<MonnaieHistoryEntry[]>([]);
  const sessionRef = useRef<MonnaieSessionResponse | null>(null);
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
    if (!exerciseType) { navigate('/module/monnaie'); return; }
    startMonnaieSession(exerciseType)
      .then((startedSession) => setSession(startedSession))
      .catch(() => setError('Impossible de démarrer la session.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!session) return;
    startTimer();
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [currentIdx, session?.session_id]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleTimeout() {
    const currentSession = sessionRef.current;
    const idx = currentIdxRef.current;
    if (!currentSession) return;
    const question = currentSession.questions[idx];
    setAnswerState('timeout');
    historyRef.current.push({ question, given: null, correct: false, timeout: true });
    recordMonnaieAnswer(currentSession.session_id, question.type, question.answer, false).catch(console.error);
    setTimeout(() => advance(currentSession, idx), 1600);
  }

  async function handleValidate() {
    if (answerStateRef.current !== 'idle' || !session) return;
    stopTimer();

    const question = session.questions[currentIdx];
    const given = parseMoneyInput(inputValue);
    const correct = given !== -1 && given === question.answer;

    setAnswerState(correct ? 'correct' : 'wrong');
    if (correct) {
      correctCountRef.current++;
      setCorrectCount(correctCountRef.current);
    }
    historyRef.current.push({ question, given, correct, timeout: false });
    recordMonnaieAnswer(session.session_id, question.type, question.answer, correct).catch(console.error);
    setTimeout(() => advance(session, currentIdx), correct ? 900 : 1600);
  }

  function handleQcmChoice(choiceValue: number) {
    if (answerStateRef.current !== 'idle' || !session) return;
    stopTimer();

    const question = session.questions[currentIdx];
    const correct = choiceValue === question.answer;

    setAnswerState(correct ? 'correct' : 'wrong');
    if (correct) {
      correctCountRef.current++;
      setCorrectCount(correctCountRef.current);
    }
    historyRef.current.push({ question, given: choiceValue, correct, timeout: false });
    recordMonnaieAnswer(session.session_id, question.type, question.answer, correct).catch(console.error);
    setTimeout(() => advance(session, currentIdx), correct ? 900 : 1600);
  }

  function advance(currentSession: MonnaieSessionResponse, idx: number) {
    if (idx + 1 >= currentSession.questions.length) {
      finishSession(currentSession);
    } else {
      setCurrentIdx(idx + 1);
      setInputValue('');
      setAnswerState('idle');
    }
  }

  async function finishSession(currentSession: MonnaieSessionResponse) {
    await completeMonnaieSession(currentSession.session_id, correctCountRef.current, historyRef.current.length).catch(console.error);
    navigate('/module/monnaie/result', {
      state: {
        exerciseType,
        correctCount: correctCountRef.current,
        total: historyRef.current.length,
        history: historyRef.current,
      },
    });
  }

  async function handleTerminate() {
    stopTimer();
    const currentSession = sessionRef.current;
    if (!currentSession || historyRef.current.length === 0) {
      navigate('/module/monnaie');
      return;
    }
    await completeMonnaieSession(currentSession.session_id, correctCountRef.current, historyRef.current.length).catch(console.error);
    navigate('/module/monnaie/result', {
      state: {
        exerciseType,
        correctCount: correctCountRef.current,
        total: historyRef.current.length,
        history: historyRef.current,
      },
    });
  }

  if (loading) {
    return (
      <PageContainer className="MonnaieGame">
        <div className="MonnaieGame__loading"><Spinner /></div>
      </PageContainer>
    );
  }

  if (error || !session || session.questions.length === 0) {
    return (
      <PageContainer className="MonnaieGame">
        <div className="MonnaieGame__error">
          <p>{error || 'Aucune question disponible.'}</p>
          <Button title="← Retour" onClick={() => navigate('/module/monnaie')} />
        </div>
      </PageContainer>
    );
  }

  const question = session.questions[currentIdx];
  const timerSeconds = session.timer_seconds;
  const isUnlimited = session.is_unlimited;
  const isFreeMode = session.response_mode === 'free';
  const answeredCount = currentIdx + (answerState !== 'idle' ? 1 : 0);
  const filledStars = Math.min(5, answeredCount === 0 ? 0 : Math.floor((correctCount / answeredCount) * 5));
  const progressPct = isUnlimited ? 0 : (currentIdx / session.questions.length) * 100;
  const showUrgent = isUrgent && answerState === 'idle';

  return (
    <PageContainer className="MonnaieGame">
      {!isUnlimited && (
        <div className="MonnaieGame__progressWrap">
          <div className="MonnaieGame__progressBar" style={{ width: `${progressPct}%` }} />
        </div>
      )}

      {timerSeconds > 0 && (
        <div className="MonnaieGame__timerWrap">
          <div
            className={`MonnaieGame__timerBar${showUrgent ? ' MonnaieGame__timerBar--urgent' : ''}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
      )}

      <div className="MonnaieGame__scoreBar">
        <div className="MonnaieGame__stars">
          {'★'.repeat(filledStars)}{'☆'.repeat(5 - filledStars)}
        </div>
        {timerSeconds > 0 && (
          <div className={`MonnaieGame__timerChip${showUrgent ? ' MonnaieGame__timerChip--urgent' : ''}`}>
            ⏱ {Math.ceil(timeRemaining)}s
          </div>
        )}
        <div className="MonnaieGame__counter">{correctCount}/{answeredCount}</div>
      </div>

      <div className={`MonnaieGame__card${answerState === 'wrong' || answerState === 'timeout' ? ' MonnaieGame__card--shake' : ''}`}>
        {!isUnlimited && (
          <span className="MonnaieGame__questionTag">
            {currentIdx + 1} / {session.questions.length}
          </span>
        )}

        <p className="MonnaieGame__prompt">{EXERCISE_PROMPTS[question.type]}</p>

        {renderQuestion(question)}

        {isFreeMode ? (
          <>
            <div className="MonnaieGame__inputWrap">
              <input
                ref={inputRef}
                type="text"
                inputMode="decimal"
                className={`MonnaieGame__input${
                  answerState === 'correct' ? ' MonnaieGame__input--correct'
                  : answerState === 'wrong' || answerState === 'timeout' ? ' MonnaieGame__input--wrong'
                  : ''
                }`}
                value={answerState !== 'idle' ? (answerState === 'timeout' ? '' : inputValue) : inputValue}
                onChange={(event) => answerState === 'idle' && setInputValue(event.target.value)}
                onKeyDown={(event) => event.key === 'Enter' && handleValidate()}
                disabled={answerState !== 'idle'}
                placeholder="0"
                maxLength={8}
              />
              <span className="MonnaieGame__inputCurrency">€</span>
            </div>

            {(answerState === 'wrong' || answerState === 'timeout') && (
              <p className="MonnaieGame__correction">
                {answerState === 'timeout' ? '⏰ Trop tard ! ' : ''}
                La réponse était <strong>{formatCents(question.answer)}</strong>
              </p>
            )}
          </>
        ) : (
          <>
            <div className="MonnaieGame__qcmChoices">
              {(question.choices ?? []).map((choice, choiceIndex) => (
                <button
                  key={choiceIndex}
                  className={`MonnaieGame__qcmChoice${
                    answerState !== 'idle' && choice === question.answer ? ' MonnaieGame__qcmChoice--correct'
                    : answerState !== 'idle' ? ' MonnaieGame__qcmChoice--disabled'
                    : ''
                  }`}
                  onClick={() => handleQcmChoice(choice)}
                  disabled={answerState !== 'idle'}
                >
                  {formatCents(choice)}
                </button>
              ))}
            </div>

            {(answerState === 'wrong' || answerState === 'timeout') && (
              <p className="MonnaieGame__correction">
                {answerState === 'timeout' ? '⏰ Trop tard ! ' : ''}
                La réponse était <strong>{formatCents(question.answer)}</strong>
              </p>
            )}
          </>
        )}
      </div>

      <div className="MonnaieGame__actions">
        {isFreeMode && answerState === 'idle' && (
          <Button
            title="✓ Valider"
            onClick={handleValidate}
            disabled={inputValue.trim() === ''}
          />
        )}
        <button className="MonnaieGame__btnTerminer" onClick={handleTerminate}>
          Terminer
        </button>
      </div>
    </PageContainer>
  );
}
