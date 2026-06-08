import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { startMonnaieSession, recordMonnaieAnswer, completeMonnaieSession } from 'src/api/monnaie.api';
import type { MonnaieSessionResponse, MonnaieQuestion, MonnaieExerciseType } from 'src/types';
import type { MonnaieHistoryEntry } from './MonnaieResult';
import { formatCents, getMonnaieImageUrl, parseMoneyInput } from '../constants/denominations';
import PageContainer from 'src/components/layout/PageContainer/PageContainer';
import Button from 'src/components/common/Button';
import GameFooter from 'src/components/common/GameFooter';
import GameChoices from 'src/components/common/GameChoices';
import Spinner from 'src/components/common/Spinner';
import { useGameSession } from 'src/hook';

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

  const [inputValue, setInputValue] = useState('');
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const {
    loading, error,
    session, currentIdx, answerState, correctCount,
    timeRemaining, timerPct, isUrgent,
    submitAnswer, handleTerminate,
  } = useGameSession<MonnaieSessionResponse, MonnaieQuestion, MonnaieHistoryEntry>({
    loader: () => {
      if (!exerciseType) return Promise.reject(new Error('Type d\'exercice manquant.'));
      return startMonnaieSession(exerciseType);
    },
    homePath: '/module/monnaie',
    resultsPath: '/module/monnaie/result',
    getQuestions: (session) => session.questions,
    getSessionId: (session) => session.session_id,
    getTimerSeconds: (session) => session.timer_seconds,
    onComplete: (sessionId, correctCount, total) => completeMonnaieSession(sessionId, correctCount, total),
    buildResultsState: (correctCount, total, history) => ({ exerciseType, correctCount, total, history }),
    buildTimeoutResult: (question) => ({ question, given: null, correct: false, timeout: true }),
    recordTimeout: (sessionId, question) => recordMonnaieAnswer(sessionId, question.type, question.answer, false),
    onQuestionChange: () => { setInputValue(''); setSelectedChoice(null); },
  });

  // Focus input à chaque nouvelle question
  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [currentIdx, session]); // eslint-disable-line react-hooks/exhaustive-deps

  function handleValidate() {
    if (!session || answerState !== 'idle') return;

    const question = session.questions[currentIdx];
    const isFreeMode = session.response_mode === 'free';
    let given: number;
    let correct: boolean;

    if (isFreeMode) {
      given = parseMoneyInput(inputValue);
      correct = given !== -1 && given === question.answer;
    } else {
      if (selectedChoice === null) return;
      given = selectedChoice;
      correct = selectedChoice === question.answer;
    }

    submitAnswer(
      correct,
      { question, given, correct, timeout: false },
      () => recordMonnaieAnswer(session.session_id, question.type, question.answer, correct),
    );
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
            <GameChoices
              options={(question.choices ?? []).map((choice) => ({ key: String(choice), label: formatCents(choice) }))}
              selectedKey={selectedChoice === null ? null : String(selectedChoice)}
              correctKey={String(question.answer)}
              answerState={answerState}
              onSelect={(key) => setSelectedChoice(Number(key))}
            />

            {(answerState === 'wrong' || answerState === 'timeout') && (
              <p className="MonnaieGame__correction">
                {answerState === 'timeout' ? '⏰ Trop tard ! ' : ''}
                La réponse était <strong>{formatCents(question.answer)}</strong>
              </p>
            )}
          </>
        )}
      </div>

      <GameFooter
        onTerminate={handleTerminate}
        onValidate={handleValidate}
        isValidateDisabled={answerState !== 'idle' || (isFreeMode ? inputValue.trim() === '' : selectedChoice === null)}
      />
    </PageContainer>
  );
}
