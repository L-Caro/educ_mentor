import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { startSession, recordAnswer, completeSession } from 'src/api/imagier.api';
import type { ImagierQuestion, ImagierSessionResponse } from 'src/types';
import GameFooter from 'src/components/common/GameFooter';
import GameChoices from 'src/components/common/GameChoices';
import GameInput from 'src/components/common/GameInput';
import GameCorrection from 'src/components/common/GameCorrection';
import GameProgressBar from 'src/components/common/GameProgressBar';
import GameTimerBar from 'src/components/common/GameTimerBar';
import GameStateView from 'src/components/common/GameStateView';
import GameCard from 'src/components/common/GameCard';
import GamePrompt from 'src/components/common/GamePrompt';
import PageContainer from 'src/components/layout/PageContainer/PageContainer';
import { capitalize } from 'src/utils/capitilize.ts';
import { useNextOnSpace, useDevMode, useGameSession } from 'src/hook';
import DevBadge from 'src/components/common/DevBadge';

type ImagierResult = { question: ImagierQuestion; wasCorrect: boolean };

export default function ImagierGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { isDevMode } = useDevMode();

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [freeInput, setFreeInput] = useState('');

  const difficulty = searchParams.get('difficulty') ?? 'level_1';
  const isFreeMode = difficulty === 'level_3';

  // Lus une seule fois au montage — pas de dépendance sur searchParams dans le loader
  const sessionCategories = searchParams.get('categories')?.split(',').filter(Boolean);
  const sessionMode = searchParams.get('mode') ?? 'fr_to_en';
  const sessionDifficulty = searchParams.get('difficulty') ?? 'level_1';
  const sessionCount = parseInt(searchParams.get('count') ?? '10', 10);

  const {
    loading, error,
    session, currentIdx, answerState,
    timerPct, isUrgent,
    submitAnswer, advanceNow, handleTerminate,
  } = useGameSession<ImagierSessionResponse, ImagierQuestion, ImagierResult>({
    loader: () => startSession({
      categories: sessionCategories,
      mode: sessionMode,
      difficulty: sessionDifficulty,
      count: sessionCount,
    }),
    homePath: '/module/imagier',
    resultsPath: '/module/imagier/result',
    getQuestions: (session) => session.questions,
    getSessionId: (session) => session.session_id,
    getTimerSeconds: (session) => session.timer_seconds,
    onComplete: (sessionId, correctCount, total) => completeSession(sessionId, correctCount, total),
    buildResultsState: (correctCount, total, results) => ({ correctCount, total, results }),
    buildTimeoutResult: (question) => ({ question, wasCorrect: false }),
    recordTimeout: (sessionId, question) => recordAnswer(sessionId, question.word_id, false),
    onQuestionChange: () => { setSelectedId(null); setFreeInput(''); },
    skipApiCalls: isDevMode,
    emptySessionError: "Aucun mot disponible. Active des mots dans l'administration.",
  });

  useNextOnSpace(answerState, advanceNow);

  function handleValidate() {
    if (!session || answerState !== 'idle') return;
    const question = session.questions[currentIdx];
    const correctChoiceLabel = question.choices.find((choice) => choice.id === question.correct_id)?.label ?? '';
    let isCorrect: boolean;
    let choiceId: string;

    if (isFreeMode) {
      if (freeInput.trim() === '') return;
      isCorrect = freeInput.trim().toLowerCase() === correctChoiceLabel.toLowerCase();
      choiceId = isCorrect ? question.correct_id : '__wrong__';
    } else {
      if (selectedId === null) return;
      isCorrect = selectedId === question.correct_id;
      choiceId = selectedId;
    }

    setSelectedId(choiceId);
    submitAnswer(
      isCorrect,
      { question, wasCorrect: isCorrect },
      () => recordAnswer(session.session_id, question.word_id, isCorrect),
    );
  }

  if (loading) return <GameStateView loading onBack={() => navigate('/module/imagier')} />;

  if (error || !session || session.questions.length === 0) {
    return <GameStateView errorMessage={error || 'Aucune question disponible.'} onBack={() => navigate('/module/imagier')} />;
  }

  const question = session.questions[currentIdx];
  const timerSeconds = session.timer_seconds;
  const total = session.questions.length;
  const progress = (currentIdx / total) * 100;
  const hideImage = question.direction === 'en_to_fr' && answerState === 'idle';
  const correctChoiceLabel = question.choices.find((choice) => choice.id === question.correct_id)?.label ?? '';
  const showUrgent = isUrgent && answerState === 'idle';

  return (
    <PageContainer className="ImagierGame">
      {isDevMode && <DevBadge />}
      <GameProgressBar progress={progress} />

      {timerSeconds > 0 && <GameTimerBar timerPct={timerPct} isUrgent={showUrgent} />}

      <GameCard shake={answerState === 'wrong' || answerState === 'timeout'}>
        <GamePrompt imageUrl={question.image_url} imageHidden={hideImage} imageAlt={question.prompt}>
          <div className="ImagierGame__promptCard">
            <p className="ImagierGame__prompt">{capitalize(question.prompt)}</p>
          </div>
        </GamePrompt>

        {isFreeMode ? (
          <GameInput
            value={answerState === 'timeout' ? '' : freeInput}
            onChange={setFreeInput}
            onSubmit={handleValidate}
            answerState={answerState}
            variant="text"
            placeholder="Tape la réponse…"
            focusKey={currentIdx}
          />
        ) : (
          <GameChoices
            options={question.choices.map((choice) => ({ key: choice.id, label: capitalize(choice.label) }))}
            selectedKey={selectedId}
            correctKey={question.correct_id}
            answerState={answerState}
            onSelect={(key) => setSelectedId(key)}
          />
        )}

        <GameCorrection answerState={answerState} answer={correctChoiceLabel} />
      </GameCard>

      <GameFooter
        onTerminate={handleTerminate}
        onValidate={handleValidate}
        isValidateDisabled={answerState !== 'idle' || (isFreeMode ? freeInput.trim() === '' : selectedId === null)}
      />
    </PageContainer>
  );
}
