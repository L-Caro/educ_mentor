import { useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { startSession, recordAnswer, completeSession } from 'src/api/imagier.api';
import type { ImagierQuestion, ImagierSessionResponse } from 'src/types';
import Button from 'src/components/common/Button';
import GameFooter from 'src/components/common/GameFooter';
import Spinner from 'src/components/common/Spinner';
import PageContainer from 'src/components/layout/PageContainer/PageContainer';
import { capitalize } from "src/utils/capitilize.ts";
import { useNextOnSpace, useDevMode, useQuestionTimer } from 'src/hook';
import DevBadge from 'src/components/common/DevBadge';

type AnswerState = 'idle' | 'correct' | 'wrong' | 'timeout';
type GameResult = { question: ImagierQuestion; wasCorrect: boolean };

export default function ImagierGame() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [session, setSession] = useState<ImagierSessionResponse | null>(null);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answerState, setAnswerState] = useState<AnswerState>('idle');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [freeInput, setFreeInput] = useState('');
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  // Ref pour accéder aux données fraîches depuis les closures setTimeout (timeout handler)
  const sessionRef = useRef<ImagierSessionResponse | null>(null);
  const currentIdxRef = useRef(0);
  const resultsRef = useRef<GameResult[]>([]);

  useEffect(() => { sessionRef.current = session; }, [session]);
  useEffect(() => { currentIdxRef.current = currentIdx; }, [currentIdx]);
  useEffect(() => { resultsRef.current = results; }, [results]);

  const { timeRemaining, timerPct, isUrgent, startTimer, stopTimer } = useQuestionTimer(
    session?.timer_seconds ?? 0,
    handleTimeout,
  );

  const difficulty = searchParams.get('difficulty') ?? 'level_1';
  const isFreeMode = difficulty === 'level_3';
  const { isDevMode } = useDevMode();

  // Les params de session sont lus une seule fois au montage — pas de dépendance sur searchParams
  const sessionCategories = searchParams.get('categories')?.split(',').filter(Boolean);
  const sessionMode = searchParams.get('mode') ?? 'fr_to_en';
  const sessionDifficulty = searchParams.get('difficulty') ?? 'level_1';
  const sessionCount = parseInt(searchParams.get('count') ?? '10', 10);

  useEffect(() => {
    startSession({
      categories: sessionCategories,
      mode: sessionMode,
      difficulty: sessionDifficulty,
      count: sessionCount,
    })
      .then((loadedSession) => {
        if (loadedSession.questions.length === 0) setError("Aucun mot disponible. Active des mots dans l'administration.");
        setSession(loadedSession);
      })
      .catch(() => setError('Impossible de démarrer la session.'))
      .finally(() => setLoading(false));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Démarre le timer à chaque nouvelle question
  useEffect(() => {
    if (!session) return;
    startTimer();
  }, [currentIdx, session?.session_id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-focus text input in free mode
  useEffect(() => {
    if (isFreeMode && answerState === 'idle') {
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [currentIdx, isFreeMode, answerState]);

  useNextOnSpace(answerState, handleNext);

  async function handleTerminate() {
    stopTimer();
    if (resultsRef.current.length === 0) {
      navigate('/module/imagier');
      return;
    }
    const finalCorrectCount = resultsRef.current.filter((result) => result.wasCorrect).length;
    if (!isDevMode) await completeSession(session!.session_id, finalCorrectCount, resultsRef.current.length).catch(console.error);
    navigate('/module/imagier/result', {
      state: { correctCount: finalCorrectCount, total: resultsRef.current.length, results: resultsRef.current },
    });
  }

  function handleTimeout() {
    const currentSession = sessionRef.current;
    const idx = currentIdxRef.current;
    if (!currentSession) return;
    const timedOutQuestion = currentSession.questions[idx];
    setAnswerState('timeout');
    setResults((prev) => {
      const updated = [...prev, { question: timedOutQuestion, wasCorrect: false }];
      resultsRef.current = updated;
      return updated;
    });
    if (!isDevMode) recordAnswer(currentSession.session_id, timedOutQuestion.word_id, false).catch(console.error);
    setTimeout(() => advanceAfterTimeout(currentSession, idx), 1600);
  }

  function advanceAfterTimeout(currentSession: ImagierSessionResponse, idx: number) {
    const nextIdx = idx + 1;
    if (nextIdx >= currentSession.questions.length) {
      const finalResults = resultsRef.current;
      const finalCorrectCount = finalResults.filter((result) => result.wasCorrect).length;
      if (!isDevMode) completeSession(currentSession.session_id, finalCorrectCount, currentSession.questions.length);
      navigate('/module/imagier/result', {
        state: { correctCount: finalCorrectCount, total: currentSession.questions.length, results: finalResults },
      });
      return;
    }
    setCurrentIdx(nextIdx);
    setAnswerState('idle');
    setSelectedId(null);
    setFreeInput('');
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
  const correctCount = results.filter((result) => result.wasCorrect).length;
  const showUrgent = isUrgent && answerState === 'idle';

  async function processAnswer(isCorrect: boolean, choiceId: string) {
    stopTimer();
    setSelectedId(choiceId);
    setAnswerState(isCorrect ? 'correct' : 'wrong');
    setResults((previous) => [...previous, { question, wasCorrect: isCorrect }]);
    if (!isDevMode) await recordAnswer(session!.session_id, question.word_id, isCorrect);
  }

  function handleChoice(choiceId: string) {
    if (answerState !== 'idle') return;
    setSelectedId(choiceId);
  }

  async function handleValidate() {
    if (answerState !== 'idle') return;
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

    await processAnswer(isCorrect, choiceId);
    setTimeout(handleNext, isCorrect ? 900 : 1600);
  }

  async function handleNext() {
    const nextIdx = currentIdx + 1;
    if (nextIdx >= total) {
      const finalCorrectCount = results.filter((result) => result.wasCorrect).length;
      if (!isDevMode) await completeSession(session!.session_id, finalCorrectCount, total);
      navigate('/module/imagier/result', {
        state: { correctCount: finalCorrectCount, total, results },
      });
      return;
    }
    setCurrentIdx(nextIdx);
    setAnswerState('idle');
    setSelectedId(null);
    setFreeInput('');
  }

  function choiceClass(choiceId: string) {
    if (answerState === 'idle') return 'ImagierGame__choice';
    if (choiceId === question.correct_id) return 'ImagierGame__choice ImagierGame__choice--correct';
    if (choiceId === selectedId) return 'ImagierGame__choice ImagierGame__choice--wrong';
    return 'ImagierGame__choice ImagierGame__choice--faded';
  }

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
              onChange={(e) => answerState === 'idle' && setFreeInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleValidate()}
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
          <div className="ImagierGame__choices">
            {question.choices.map((choice) => (
              <button
                key={choice.id}
                className={choiceClass(choice.id)}
                onClick={() => handleChoice(choice.id)}
                disabled={answerState !== 'idle'}
              >
                {capitalize(choice.label)}
              </button>
            ))}
          </div>
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
