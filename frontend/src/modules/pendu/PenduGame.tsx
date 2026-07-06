import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { selectModuleSetup } from 'src/store/slice/gameSetupSlice';
import { setGameResult } from 'src/store/slice/gameResultSlice';
import { useStartPenduSessionMutation, useCompletePenduSessionMutation } from './pendu.api';
import type { PenduSessionResponse } from './pendu.type';
import HangmanSVG from './HangmanSVG';
import Spinner from 'src/components/common/Spinner';
import Button from 'src/components/common/Button';
import './pendu.scss';

const MODULE_ID = 'pendu';

const LETTER_ROWS = [
  ['A', 'B', 'C', 'D', 'E', 'F'],
  ['G', 'H', 'I', 'J', 'K', 'L'],
  ['M', 'N', 'O', 'P', 'Q', 'R'],
  ['S', 'T', 'U', 'V', 'W', 'X'],
  ['Y', 'Z']
];

export default function PenduGame() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const setup = useAppSelector(selectModuleSetup(MODULE_ID)) ?? {};

  const difficulty = (setup['difficulty'] as string) ?? 'normal';
  const lettersRevealed = parseInt((setup['letters_revealed'] as string) ?? '0', 10);
  const wordLength = (setup['word_length'] as string) ?? 'any';

  const [startSession] = useStartPenduSessionMutation();
  const [completeSession] = useCompletePenduSessionMutation();

  const [session, setSession] = useState<PenduSessionResponse | null>(null);
  const [guessed, setGuessed] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);

  const gameOverCalledRef = useRef(false);

  useEffect(() => {
    gameOverCalledRef.current = false;
    startSession({ difficulty, letters_revealed: lettersRevealed, word_length: wordLength })
      .unwrap()
      .then((data) => {
        setSession(data);
        setGuessed(new Set(data.pre_revealed));
      })
      .catch(() => setError('Impossible de charger la partie.'));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [difficulty]);

  // Dérivé de session + guessed
  const word = session?.word ?? '';
  const uniqueWordLetters = [...new Set(word.split(''))];
  const wrongLetters = new Set([...guessed].filter((l) => !word.includes(l)));
  const wrongCount = wrongLetters.size;
  const maxErrors = session?.max_errors ?? 6;
  const isWon = session !== null && uniqueWordLetters.every((l) => guessed.has(l));
  const isLost = wrongCount >= maxErrors;
  const isOver = isWon || isLost;

  // Appel unique à la fin de partie
  useEffect(() => {
    if (!isOver || !session || gameOverCalledRef.current) return;
    gameOverCalledRef.current = true;

    const wrongLettersArr = [...wrongLetters];

    (async () => {
      await completeSession({ sessionId: session.session_id, won: isWon })
        .unwrap()
        .catch(() => { /* on ignore les erreurs réseau */ });

      if (isWon) {
        dispatch(setGameResult({
          correctCount: 1,
          total: 1,
          scoreLabel: 'Trouvé !',
          results: [{
            label: session.word,
            given: wrongLettersArr.join(', ') || '—',
            expected: session.word,
            correct: true,
            timeout: false,
          }],
        }));
      } else {
        dispatch(setGameResult({
          correctCount: 0,
          total: 1,
          scoreLabel: 'Perdu',
          results: [{
            label: '???',
            given: wrongLettersArr.join(', '),
            expected: session.word,
            correct: false,
            timeout: false,
          }],
        }));
      }

      setTimeout(() => navigate(`/module/${MODULE_ID}/result`), 700);
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOver, session]);

  function handleLetterClick(letter: string) {
    if (isOver || guessed.has(letter)) return;
    setGuessed((prev) => new Set([...prev, letter]));
  }

  if (error) {
    return (
      <div className="PenduGame">
        <p style={{ color: 'var(--color-error)', textAlign: 'center' }}>{error}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="PenduGame" style={{ justifyContent: 'center' }}>
        <Spinner />
      </div>
    );
  }

  return (
    <div className="PenduGame">
      {/* Mot masqué */}
      <div className="PenduGame__word">
        {word.split('').map((letter, index) => {
          const isPreRevealed = session.pre_revealed.includes(letter) && !wrongLetters.has(letter);
          const isRevealed = guessed.has(letter);
          const modifiers = [
            'PenduGame__letter',
            isPreRevealed ? 'PenduGame__letter--preRevealed' : '',
            isRevealed && !isPreRevealed ? 'PenduGame__letter--revealed' : '',
          ].filter(Boolean).join(' ');
          return (
            <div key={index} className={modifiers}>
              {isRevealed ? letter : ''}
            </div>
          );
        })}
      </div>

      {/* Dessin du pendu */}
      <HangmanSVG wrongCount={wrongCount} maxErrors={maxErrors} />

      {/* Grille de lettres */}
      <div className="PenduGame__letters">
        {LETTER_ROWS.map((row) =>
          row.map((letter) => {
            const isCorrect = guessed.has(letter) && word.includes(letter);
            const isWrong = guessed.has(letter) && !word.includes(letter);
            const btnClass = [
              'PenduGame__letterBtn',
              isCorrect ? 'PenduGame__letterBtn--correct' : '',
              isWrong ? 'PenduGame__letterBtn--wrong' : '',
            ].filter(Boolean).join(' ');
            return (
              <button
                key={letter}
                className={btnClass}
                onClick={() => handleLetterClick(letter)}
                disabled={guessed.has(letter) || isOver}
                aria-label={letter}
              >
                {letter}
              </button>
            );
          })
        )}
      </div>

      {/* Message de fin */}
      {isOver && (
        <div className="PenduGame__over">
          <p className="PenduGame__overMessage">
            {isWon ? 'Bravo !' : `Le mot était : ${word}`}
          </p>
          <div className="PenduGame__overActions">
            <Button
              size="sm"
              variant="outline"
              onClick={() => navigate(`/module/${MODULE_ID}`)}
            >
              Rejouer
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/')}
            >
              Accueil
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}