import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { startSession, recordAnswer, completeSession } from 'src/api/imagier.api';
import type { ImagierQuestion, ImagierSessionResponse } from 'src/types';
import Button from 'src/components/common/Button';
import GameFooter from 'src/components/common/GameFooter';
import GameChoices from 'src/components/common/GameChoices';
import Spinner from 'src/components/common/Spinner';
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
  const inputRef = useRef<HTMLInputElement>(null);

  const difficulty = searchParams.get('difficulty') ?? 'level_1';
  const isFreeMode = difficulty === 'level_3';

  // Lus une seule fois au montage — pas de dépendance sur searchParams dans le loader
  const sessionCategories = searchParams.get('categories')?.split(',').filter(Boolean);
  const sessionMode = searchParams.get('mode') ?? 'fr_to_en';
  const sessionDifficulty = searchParams.get('difficulty') ?? 'level_1';
  const sessionCount = parseInt(searchParams.get('count') ?? '10', 10);

  const {
    loading, error,
    session, currentIdx, answerState, correctCount,
    timeRemaining, timerPct, isUrgent,
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

  if (loading) {
    return (
      <PageContainer className="ImagierGame">
        <div className="ImagierGame__loading"><Spinner /></div>
      </PageContainer>
    );
  }

  if (error || !session || session.questions.length === 0) {
    return (
      <PageContainer className="ImagierGame">
        <div className="ImagierGame__error">
          <p className="ImagierGame__errorMsg">{error || 'Aucune question disponible.'}</p>
          <Button title="← Retour" onClick={() => navigate('/module/imagier')} />
        </div>
      </PageContainer>
    );
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
      <div className="ImagierGame__progressWrap">
        <div className="ImagierGame__progressBar" style={{ width: `${progress}%` }} />
      </div>

      {timerSeconds > 0 && (
        <div className="ImagierGame__timerWrap">
          <div
            className={`ImagierGame__timerBar${showUrgent ? ' ImagierGame__timerBar--urgent' : ''}`}
            style={{ width: `${timerPct}%` }}
          />
        </div>
      )}

      <div className="ImagierGame__content">
        <div className={`ImagierGame__imageCard${hideImage ? ' ImagierGame__imageCard--hidden' : ''}`}>
          {hideImage
            ? <span className="ImagierGame__imagePlaceholder">🙈</span>
            : question.image_url
              ? <img src={question.image_url} alt={question.prompt} className="ImagierGame__image" />
              : <span className="ImagierGame__imagePlaceholder">❓</span>}
        </div>

        <div className="ImagierGame__promptCard">
          <p className="ImagierGame__prompt">{capitalize(question.prompt)}</p>
        </div>

        {isFreeMode ? (
          <div className="ImagierGame__freeInput">
            <input
              ref={inputRef}
              type="text"
              className={`ImagierGame__freeInputField${
                answerState === 'correct' ? ' ImagierGame__freeInputField--correct'
                : answerState === 'wrong' ? ' ImagierGame__freeInputField--wrong'
                : ''
              }`}
              value={answerState !== 'idle' ? correctChoiceLabel : freeInput}
              onChange={(event) => answerState === 'idle' && setFreeInput(event.target.value)}
              onKeyDown={(event) => event.key === 'Enter' && handleValidate()}
              disabled={answerState !== 'idle'}
              placeholder="Tape la réponse…"
              autoComplete="off"
              autoCorrect="off"
              spellCheck={false}
            />
            {answerState === 'wrong' && (
              <p className="ImagierGame__freeCorrect">
                Réponse : <strong>{correctChoiceLabel}</strong>
              </p>
            )}
          </div>
        ) : (
          <GameChoices
            options={question.choices.map((choice) => ({ key: choice.id, label: capitalize(choice.label) }))}
            selectedKey={selectedId}
            correctKey={question.correct_id}
            answerState={answerState}
            onSelect={(key) => setSelectedId(key)}
          />
        )}
      </div>

      <GameFooter
        onTerminate={handleTerminate}
        onValidate={handleValidate}
        isValidateDisabled={answerState !== 'idle' || (isFreeMode ? freeInput.trim() === '' : selectedId === null)}
      />
    </PageContainer>
  );
}
