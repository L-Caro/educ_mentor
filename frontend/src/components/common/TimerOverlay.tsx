import { useEffect, useRef, useState } from 'react';
import { useSessionTimer } from 'src/context/SessionTimerContext';
import { useAuth } from 'src/hooks/useAuth';

const PIN_LENGTH = 4;
const KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['⌫', '0', '✓'],
];

export default function TimerOverlay() {
  const { showOverlay, resetTimer } = useSessionTimer();
  const { login } = useAuth();
  const [pin, setPin]     = useState('');
  const [error, setError] = useState('');

  const submitRef = useRef<() => void>(() => {});

  async function handleSubmit() {
    if (pin.length < PIN_LENGTH) return;
    setError('');
    try {
      await login(pin);
      resetTimer();
    } catch {
      setError('PIN incorrect');
      setPin('');
    }
  }

  // Garde la dernière version de handleSubmit accessible depuis l'écouteur clavier.
  useEffect(() => { submitRef.current = handleSubmit; });

  // Vide le PIN à l'ouverture/fermeture de l'overlay (synchro légitime sur showOverlay).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPin(''); setError(''); }, [showOverlay]);

  useEffect(() => {
    if (!showOverlay) return;
    function onKeyDown(e: KeyboardEvent) {
      if (/^[0-9]$/.test(e.key))  setPin(p => p.length < PIN_LENGTH ? p + e.key : p);
      else if (e.key === 'Backspace') setPin(p => p.slice(0, -1));
      else if (e.key === 'Enter')     submitRef.current();
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [showOverlay]);

  function handleKey(key: string) {
    if (key === '⌫')      setPin(p => p.slice(0, -1));
    else if (key === '✓') handleSubmit();
    else                  setPin(p => p.length < PIN_LENGTH ? p + key : p);
  }

  if (!showOverlay) return null;

  return (
    <div className="TimerOverlay">
      <div className="TimerOverlay__card">
        <span className="TimerOverlay__icon">⏰</span>
        <h2 className="TimerOverlay__title">C'est l'heure de faire une pause !</h2>
        <p className="TimerOverlay__subtitle">Entre le code pour continuer</p>

        <div className="TimerOverlay__dots">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <span key={i} className={`TimerOverlay__dot${i < pin.length ? ' TimerOverlay__dot--filled' : ''}`} />
          ))}
        </div>

        {error && <p className="TimerOverlay__error">{error}</p>}

        <div className="TimerOverlay__keypad">
          {KEYPAD.flat().map((key) => (
            <button
              key={key}
              className="TimerOverlay__key"
              disabled={key === '✓' && pin.length < PIN_LENGTH}
              onClick={() => handleKey(key)}
            >
              {key}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
