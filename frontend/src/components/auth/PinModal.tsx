import { useEffect, useState } from 'react';
import Button from 'src/components/common/Button';

const PIN_LENGTH = 4;

const KEYPAD = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['⌫', '0', '✓'],
];

interface PinModalProps {
  show: boolean;
  onSubmit: (pin: string) => void;
  error?: string;
}

export default function PinModal({ show, onSubmit, error }: PinModalProps) {
  const [pin, setPin] = useState('');

  // Vide le champ PIN à l'ouverture du modal et après une erreur (synchro légitime sur props).
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setPin(''); }, [show, error]);

  // Support clavier : chiffres, Backspace, Enter
  useEffect(() => {
    if (!show) return;

    function onKeyDown(event: KeyboardEvent) {
      if (/^[0-9]$/.test(event.key)) {
        setPin(currentPin => currentPin.length < PIN_LENGTH ? currentPin + event.key : currentPin);
      } else if (event.key === 'Backspace') {
        setPin(currentPin => currentPin.slice(0, -1));
      } else if (event.key === 'Enter') {
        setPin(currentPin => { if (currentPin.length === PIN_LENGTH) onSubmit(currentPin); return currentPin; });
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [show, onSubmit]);

  function handleKey(key: string) {
    if (key === '⌫') {
      setPin(currentPin => currentPin.slice(0, -1));
    } else if (key === '✓') {
      if (pin.length === PIN_LENGTH) onSubmit(pin);
    } else {
      setPin(currentPin => currentPin.length < PIN_LENGTH ? currentPin + key : currentPin);
    }
  }

  if (!show) return null;

  return (
    <div className="PinModal__overlay">
      <div className="PinModal__content">
        <h5 className="PinModal__title">Code PIN</h5>

        <div className="PinModal__dots">
          {Array.from({ length: PIN_LENGTH }).map((_, dotIndex) => (
            <span
              key={dotIndex}
              className={`PinModal__dot${dotIndex < pin.length ? ' PinModal__dot--filled' : ''}`}
            />
          ))}
        </div>

        {error && <p className="PinModal__error">{error}</p>}

        <div className="PinModal__keypad">
          {KEYPAD.flat().map((key) => (
            <Button
              key={key}
              variant={key === '✓' ? 'primary' : key === '⌫' ? 'primary' : 'outline'}
              disabled={key === '✓' && pin.length < PIN_LENGTH}
              onClick={() => handleKey(key)}
            >
              {key}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
