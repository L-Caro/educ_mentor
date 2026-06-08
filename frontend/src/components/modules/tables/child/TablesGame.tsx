import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  startTablesSession,
  recordTablesAnswer,
  completeTablesSession,
} from 'src/api/tables.api';
import type { TablesQuestion, TablesSessionResponse } from 'src/types';
import PageContainer from 'src/components/layout/PageContainer/PageContainer';
import Button from 'src/components/common/Button';
import Spinner from 'src/components/common/Spinner';
import { useNextOnSpace, useDevMode, useQuestionTimer } from 'src/hook';
import { generateTablesDevSession } from 'src/api/tables.dev';
import DevBadge from 'src/components/common/DevBadge';

type AnswerState = 'idle' | 'correct' | 'wrong' | 'timeout';


export default function TablesGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState<TablesSessionResponse | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [freeInput, setFreeInput] = useState('');
  const [correctCount, setCorrectCount] = useState(0);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const resultsRef = useRef<{ question: TablesQuestion; wasCorrect: boolean }[]>([]);
  const streakRef = useRef(0);
  const correctCountRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isFreeMode = parseInt(searchParams.get('choices_count') ?? '4', 10) === 0;
  const showHints = searchParams.get('hints') !== 'false';
  const { isDevMode } = useDevMode();

  const { timeRemaining, timerPct, isUrgent, startTimer, stopTimer } = useQuestionTimer(
    session?.timer_seconds ?? 0,
    handleTimeout,
  );

  useEffect(() => {
    const tables = searchParams.get('tables')?.split(',').map(Number).filter((n) => !isNaN(n)) ?? [];
    const count = parseInt(searchParams.get('count') ?? '10', 10);
    const choicesCount = parseInt(searchParams.get('choices_count') ?? '4', 10);
    const excludeTrivial = searchParams.get('exclude_trivial') === 'true';

    if (isDevMode) {
      const s = generateTablesDevSession({ selectedTables: tables, count, choicesCount, excludeTrivial });
      if (s.questions.length === 0) setError('Aucune question disponible. Sélectionne au moins une table.');
      setSession(s);
      setLoading(false);
    } else {
      startTablesSession({ selectedTables: tables, count, choicesCount, excludeTrivial })
        .then((s) => {
          if (s.questions.length === 0) setError('Aucune question disponible. Sélectionne au moins une table.');
          setSession(s);
        })
        .catch(() => setError('Impossible de démarrer la session.'))
        .finally(() => setLoading(false));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Démarre le timer à chaque nouvelle question
  useEffect(() => {
    if (!session) return;
    startTimer();
  }, [currentIdx, session?.session_id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus input in free mode when question changes
  useEffect(() => {
    if (isFreeMode && answerState === 'idle') {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [currentIdx, isFreeMode, answerState]);

  useNextOnSpace(answerState, handleNext);

  function handleTimeout() {
    if (!session) return;
    const timedOutQuestion = session.questions[currentIdx];
    stopTimer();
    setAnswerState('timeout');
    resultsRef.current.push({ question: timedOutQuestion, wasCorrect: false });
    if (!isDevMode) recordTablesAnswer(session.session_id, timedOutQuestion.display_a, timedOutQuestion.display_b, false).catch(console.error);
    setTimeout(handleNext, 1600);
  }

  async function processAnswer(isCorrect: boolean, question: TablesQuestion) {
    stopTimer();
    setAnswerState(isCorrect ? 'correct' : 'wrong');

    if (isCorrect) {
      streakRef.current++;
      correctCountRef.current++;
      setStreak(streakRef.current);
      setCorrectCount(correctCountRef.current);
    } else {
      streakRef.current = 0;
      setStreak(0);
    }

    resultsRef.current.push({ question, wasCorrect: isCorrect });
    if (!isDevMode) await recordTablesAnswer(session!.session_id, question.display_a, question.display_b, isCorrect);
  }

  async function handleChoice(choice: number) {
    if (answerState !== 'idle' || !session) return;
    const question = session.questions[currentIdx];
    setSelectedChoice(choice);
    await processAnswer(choice === question.answer, question);
  }

  async function handleFreeSubmit() {
    if (answerState !== 'idle' || !session || freeInput.trim() === '') return;
    const question = session.questions[currentIdx];
    const parsed = parseInt(freeInput.trim(), 10);
    await processAnswer(!isNaN(parsed) && parsed === question.answer, question);
  }

  async function handleNext() {
    if (!session) return;
    const nextIdx = currentIdx + 1;
    if (nextIdx >= session.questions.length) {
      if (!isDevMode) await completeTablesSession(session.session_id, correctCountRef.current, session.questions.length);
      navigate('/module/tables/result', {
        state: {
          correctCount: correctCountRef.current,
          total: session.questions.length,
          results: resultsRef.current,
        },
      });
      return;
    }
    setCurrentIdx(nextIdx);
    setAnswerState('idle');
    setSelectedChoice(null);
    setFreeInput('');
  }

  if (loading) {
    return (
      <PageContainer className="TablesGame">
        <div className="TablesGame__loading"><Spinner /></div>
      </PageContainer>
    );
  }

  if (error || !session || session.questions.length === 0) {
    return (
      <PageContainer className="TablesGame">
        <div className="TablesGame__error">
          <p>{error || 'Aucune question disponible.'}</p>
          <Button title="← Retour" onClick={() => navigate('/module/tables')} />
        </div>
      </PageContainer>
    );
  }

  const question = session.questions[currentIdx];
  const timerSeconds = session.timer_seconds;
  const total = session.questions.length;
  const progress = (currentIdx / total) * 100;
  const filledStars = Math.min(5, Math.floor(correctCountRef.current / Math.max(1, total / 5)));
  const showUrgent = isUrgent && answerState === 'idle';

  function choiceClass(choice: number): string {
    if (answerState === 'idle') return 'TablesGame__choice';
    if (choice === question.answer) return 'TablesGame__choice TablesGame__choice--correct';
    if (choice === selectedChoice) return 'TablesGame__choice TablesGame__choice--wrong';
    return 'TablesGame__choice TablesGame__choice--faded';
  }

  return (
    <PageContainer className="TablesGame">
      {isDevMode && <DevBadge />}

      <div className="TablesGame__progressWrap">
        <div className="TablesGame__progressBar" style={{ width: `${progress}%` }} />
      </div>

      {timerSeconds > 0 && (
        <div className="TablesGame__timerWrap">
          <div
            className={`TablesGame__timerBar${showUrgent ? ' TablesGame__timerBar--urgent' : ''}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
      )}

      <div className="TablesGame__scoreBar">
        <div className="TablesGame__stars">
          {'★'.repeat(filledStars)}{'☆'.repeat(5 - filledStars)}
        </div>
        {timerSeconds > 0 && (
          <div className={`TablesGame__timerChip${showUrgent ? ' TablesGame__timerChip--urgent' : ''}`}>
            ⏱ {Math.ceil(timeRemaining)}s
          </div>
        )}
        <div className="TablesGame__streak" data-active={streak > 0}>
          🔥 {streak} série
        </div>
        <div className="TablesGame__counter">{correctCountRef.current}/{total}</div>
      </div>

      <div className="TablesGame__card">
        <span className="TablesGame__questionTag">Question {currentIdx + 1} / {total}</span>
        <p className="TablesGame__question">
          {question.display_a} × {question.display_b} = ?
        </p>
        {showHints && question.hint && (
          <p className="TablesGame__hint">{question.hint}</p>
        )}

        {isFreeMode ? (
          <div className="TablesGame__freeInput">
            <input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
              className={`TablesGame__freeInputField${
                answerState === 'correct' ? ' TablesGame__freeInputField--correct'
                : answerState === 'wrong' ? ' TablesGame__freeInputField--wrong'
                : ''
              }`}
              value={answerState !== 'idle' ? String(question.answer) : freeInput}
              onChange={(e) => answerState === 'idle' && setFreeInput(e.target.value.replace(/\D/g, ''))}
              onKeyDown={(e) => e.key === 'Enter' && handleFreeSubmit()}
              disabled={answerState !== 'idle'}
              placeholder="?"
              maxLength={3}
            />
            {answerState === 'wrong' && (
              <p className="TablesGame__freeCorrect">
                Réponse : <strong>{question.answer}</strong>
              </p>
            )}
          </div>
        ) : (
          <div className="TablesGame__choices">
            {question.choices.map((choice) => (
              <button
                key={choice}
                className={choiceClass(choice)}
                onClick={() => handleChoice(choice)}
                disabled={answerState !== 'idle'}
              >
                {choice}
              </button>
            ))}
          </div>
        )}
      </div>

      {isFreeMode && answerState === 'idle' ? (
        <div className="TablesGame__next">
          <Button title="✓ Valider" onClick={handleFreeSubmit} />
        </div>
      ) : answerState !== 'idle' ? (
        <div className="TablesGame__next">
          <Button
            title={currentIdx + 1 >= total ? 'Voir les résultats 🎉' : 'Suivant →'}
            onClick={handleNext}
          />
        </div>
      ) : null}
    </PageContainer>
  );
}
