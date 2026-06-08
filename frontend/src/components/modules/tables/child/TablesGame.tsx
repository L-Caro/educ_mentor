import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { startTablesSession, recordTablesAnswer, completeTablesSession } from 'src/api/tables.api';
import type { TablesQuestion, TablesSessionResponse } from 'src/types';
import PageContainer from 'src/components/layout/PageContainer/PageContainer';
import Button from 'src/components/common/Button';
import GameFooter from 'src/components/common/GameFooter';
import GameChoices from 'src/components/common/GameChoices';
import Spinner from 'src/components/common/Spinner';
import { useNextOnSpace, useDevMode, useGameSession } from 'src/hook';
import { generateTablesDevSession } from 'src/api/tables.dev';
import DevBadge from 'src/components/common/DevBadge';

type TablesResult = { question: TablesQuestion; wasCorrect: boolean };

export default function TablesGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDevMode } = useDevMode();

  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [freeInput, setFreeInput] = useState('');
  const [streak, setStreak] = useState(0);
  const streakRef = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const isFreeMode = parseInt(searchParams.get('choices_count') ?? '4', 10) === 0;
  const showHints = searchParams.get('hints') !== 'false';

  const tables = searchParams.get('tables')?.split(',').map(Number).filter((n) => !isNaN(n)) ?? [];
  const count = parseInt(searchParams.get('count') ?? '10', 10);
  const choicesCount = parseInt(searchParams.get('choices_count') ?? '4', 10);
  const excludeTrivial = searchParams.get('exclude_trivial') === 'true';

  const {
    loading, error,
    session, currentIdx, answerState, correctCount,
    timeRemaining, timerPct, isUrgent,
    submitAnswer, advanceNow, handleTerminate,
  } = useGameSession<TablesSessionResponse, TablesQuestion, TablesResult>({
    loader: () => isDevMode
      ? Promise.resolve(generateTablesDevSession({ selectedTables: tables, count, choicesCount, excludeTrivial }))
      : startTablesSession({ selectedTables: tables, count, choicesCount, excludeTrivial }),
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

  // Auto-focus input en mode libre à chaque nouvelle question
  useEffect(() => {
    if (isFreeMode && answerState === 'idle') {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [currentIdx, isFreeMode, answerState]);

  useNextOnSpace(answerState, advanceNow);

  function handleValidate() {
    if (!session || answerState !== 'idle') return;
    const question = session.questions[currentIdx];
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
  const filledStars = Math.min(5, Math.floor(correctCount / Math.max(1, total / 5)));
  const showUrgent = isUrgent && answerState === 'idle';

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
        <div className="TablesGame__counter">{correctCount}/{total}</div>
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
              onChange={(event) => answerState === 'idle' && setFreeInput(event.target.value.replace(/\D/g, ''))}
              onKeyDown={(event) => event.key === 'Enter' && handleValidate()}
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
          <GameChoices
            options={question.choices.map((choice) => ({ key: String(choice), label: choice }))}
            selectedKey={selectedChoice === null ? null : String(selectedChoice)}
            correctKey={String(question.answer)}
            answerState={answerState}
            onSelect={(key) => setSelectedChoice(Number(key))}
          />
        )}
      </div>

      <GameFooter
        onTerminate={handleTerminate}
        onValidate={handleValidate}
        isValidateDisabled={answerState !== 'idle' || (isFreeMode ? freeInput.trim() === '' : selectedChoice === null)}
      />
    </PageContainer>
  );
}
