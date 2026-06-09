import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { startMonnaieSession, recordMonnaieAnswer, completeMonnaieSession } from 'src/api/monnaie.api';
import type { MonnaieSessionResponse, MonnaieQuestion, MonnaieExerciseType } from 'src/types';
import type { MonnaieHistoryEntry } from './MonnaieResult';
import { formatCents, getMonnaieImageUrl, parseMoneyInput } from '../constants/denominations';
import PageContainer from 'src/components/layout/PageContainer/PageContainer';
import GameFooter from 'src/components/common/GameFooter';
import GameChoices from 'src/components/common/GameChoices';
import GameInput from 'src/components/common/GameInput';
import GameCorrection from 'src/components/common/GameCorrection';
import GameScoreBar from 'src/components/common/GameScoreBar';
import GameProgressBar from 'src/components/common/GameProgressBar';
import GameTimerBar from 'src/components/common/GameTimerBar';
import GameCard from 'src/components/common/GameCard';
import GameStateView from 'src/components/common/GameStateView';
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

  if (loading) return <GameStateView loading onBack={() => navigate('/module/monnaie')} />;

  if (error || !session || session.questions.length === 0) {
    return <GameStateView errorMessage={error || 'Aucune question disponible.'} onBack={() => navigate('/module/monnaie')} />;
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
          <span className="MonnaieGame__questionTag">
            {currentIdx + 1} / {session.questions.length}
          </span>
        )}

        <p className="MonnaieGame__prompt">{EXERCISE_PROMPTS[question.type]}</p>

        {renderQuestion(question)}

        {isFreeMode ? (
          <GameInput
            value={answerState === 'timeout' ? '' : inputValue}
            onChange={setInputValue}
            onSubmit={handleValidate}
            answerState={answerState}
            inputMode="decimal"
            suffix="€"
            maxLength={8}
            placeholder="0"
            focusKey={currentIdx}
          />
        ) : (
          <GameChoices
            options={(question.choices ?? []).map((choice) => ({ key: String(choice), label: formatCents(choice) }))}
            selectedKey={selectedChoice === null ? null : String(selectedChoice)}
            correctKey={String(question.answer)}
            answerState={answerState}
            onSelect={(key) => setSelectedChoice(Number(key))}
          />
        )}

        <GameCorrection answerState={answerState} answer={formatCents(question.answer)} />
      </GameCard>

      <GameFooter
        onTerminate={handleTerminate}
        onValidate={handleValidate}
        isValidateDisabled={answerState !== 'idle' || (isFreeMode ? inputValue.trim() === '' : selectedChoice === null)}
      />
    </PageContainer>
  );
}
