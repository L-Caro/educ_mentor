import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { selectModuleSetup } from 'src/store/slice/gameSetupSlice';
import { setGameResult } from 'src/store/slice/gameResultSlice';
import { useStartMemorySessionMutation, useCompleteMemorySessionMutation } from './memory.api';
import type { MemoryCard, MemoryMode, MemoryPair, MemorySessionResponse } from './memory.type';
import './memory.scss';

const MODULE_ID = 'memory';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildCards(pairs: MemoryPair[], mode: MemoryMode): MemoryCard[] {
  const cards: MemoryCard[] = [];
  for (const pair of pairs) {
    const imageCard: MemoryCard = {
      cardId: `${pair.id}-a`,
      pairId: pair.id,
      type: 'image',
      content: pair.image_url ?? '',
    };
    const partnerCard: MemoryCard =
      mode === 'image'
        ? { cardId: `${pair.id}-b`, pairId: pair.id, type: 'image', content: pair.image_url ?? '' }
        : mode === 'image_word_fr'
          ? { cardId: `${pair.id}-b`, pairId: pair.id, type: 'word', content: pair.word_fr }
          : { cardId: `${pair.id}-b`, pairId: pair.id, type: 'word', content: pair.word_en };
    cards.push(imageCard, partnerCard);
  }
  return shuffle(cards);
}

function gridCols(pairsCount: number): number {
  if (pairsCount <= 8) return 4;
  if (pairsCount <= 12) return 6;
  return 8;
}

export default function MemoryGame() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const setup = useAppSelector(selectModuleSetup(MODULE_ID)) ?? {};

  const pairsCount = parseInt((setup['pairs_count'] as string | undefined) ?? '6', 10);
  const mode = ((setup['mode'] as string | undefined) ?? 'image') as MemoryMode;

  const [startSession] = useStartMemorySessionMutation();
  const [completeSession] = useCompleteMemorySessionMutation();

  const [session, setSession] = useState<MemorySessionResponse | null>(null);
  const [cards, setCards] = useState<MemoryCard[]>([]);
  const [flipped, setFlipped] = useState<string[]>([]);
  const [matched, setMatched] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState(0);
  const [isChecking, setIsChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Garde contre les double-clics pendant le délai de retournement
  const isCheckingRef = useRef(false);

  useEffect(() => {
    startSession({ pairs_count: pairsCount, mode })
      .unwrap()
      .then((data) => {
        setSession(data);
        setCards(buildCards(data.pairs, data.mode));
      })
      .catch(() => setError('Impossible de charger la partie.'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGameWon = useCallback(
    async (finalAttempts: number, sessionData: MemorySessionResponse) => {
      await completeSession({ sessionId: sessionData.session_id, attempts: finalAttempts })
        .unwrap()
        .catch(() => { /* on ignore les erreurs réseau ici */ });

      const results = sessionData.pairs.map((pair) => ({
        label: pair.word_fr,
        given: null as null,
        expected: `${pair.word_fr} / ${pair.word_en}`,
        correct: true,
        timeout: false,
        thumbUrl: pair.image_url,
      }));

      dispatch(setGameResult({
        correctCount: sessionData.pairs.length,
        total: sessionData.pairs.length,
        scoreLabel: `${finalAttempts} coup${finalAttempts > 1 ? 's' : ''}`,
        results,
      }));

      navigate(`/module/${MODULE_ID}/result`);
    },
    [completeSession, dispatch, navigate],
  );

  const handleCardClick = useCallback(
    (cardId: string, pairId: string) => {
      if (isCheckingRef.current) return;
      if (matched.has(pairId)) return;
      if (flipped.includes(cardId)) return;
      if (flipped.length >= 2) return;

      const newFlipped = [...flipped, cardId];
      setFlipped(newFlipped);

      if (newFlipped.length < 2) return;

      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      const pairId1 = cards.find((c) => c.cardId === newFlipped[0])!.pairId;
      const pairId2 = cards.find((c) => c.cardId === newFlipped[1])!.pairId;

      if (pairId1 === pairId2) {
        const newMatched = new Set([...matched, pairId1]);
        setMatched(newMatched);
        setFlipped([]);

        if (session && newMatched.size === session.pairs.length) {
          setTimeout(() => handleGameWon(newAttempts, session), 700);
        }
      } else {
        isCheckingRef.current = true;
        setIsChecking(true);
        setTimeout(() => {
          setFlipped([]);
          setIsChecking(false);
          isCheckingRef.current = false;
        }, 1000);
      }
    },
    [attempts, cards, flipped, handleGameWon, matched, session],
  );

  if (error) {
    return (
      <div className="MemoryGame">
        <p style={{ color: 'var(--color-error)', textAlign: 'center' }}>{error}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="MemoryGame">
        <p style={{ color: 'var(--color-base-content)', opacity: 0.5 }}>Chargement…</p>
      </div>
    );
  }

  const cols = gridCols(pairsCount);
  const matchedCount = matched.size;

  return (
    <div className="MemoryGame">
      <p className="MemoryGame__counter">
        {matchedCount} / {session.pairs.length} paires, {attempts} coup{attempts > 1 ? 's' : ''}
      </p>

      <div
        className="MemoryBoard"
        style={{ '--cols': cols } as React.CSSProperties}
      >
        {cards.map((card) => {
          const isFlipped = flipped.includes(card.cardId) || matched.has(card.pairId);
          const isMatchedCard = matched.has(card.pairId);
          const isUnclickable = isChecking || isMatchedCard || flipped.includes(card.cardId);

          return (
            <div
              key={card.cardId}
              className={[
                'MemoryCard',
                isFlipped ? 'MemoryCard--flipped' : '',
                isMatchedCard ? 'MemoryCard--matched' : '',
                isUnclickable ? 'MemoryCard--unclickable' : '',
              ].filter(Boolean).join(' ')}
              onClick={() => !isUnclickable && handleCardClick(card.cardId, card.pairId)}
            >
              <div className="MemoryCard__inner">
                <div className="MemoryCard__front">
                  <span className="MemoryCard__front-icon">🃏</span>
                </div>
                <div className="MemoryCard__back">
                  {card.type === 'image' ? (
                    <img src={card.content} alt="" draggable={false} />
                  ) : (
                    <span className="MemoryCard__back-word">{card.content}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}