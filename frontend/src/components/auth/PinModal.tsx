import { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';

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

    function onKeyDown(e: KeyboardEvent) {
      if (/^[0-9]$/.test(e.key)) {
        setPin(p => p.length < PIN_LENGTH ? p + e.key : p);
      } else if (e.key === 'Backspace') {
        setPin(p => p.slice(0, -1));
      } else if (e.key === 'Enter') {
        setPin(p => { if (p.length === PIN_LENGTH) onSubmit(p); return p; });
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [show, onSubmit]);

  function handleKey(key: string) {
    if (key === '⌫') {
      setPin(p => p.slice(0, -1));
    } else if (key === '✓') {
      if (pin.length === PIN_LENGTH) onSubmit(pin);
    } else {
      setPin(p => p.length < PIN_LENGTH ? p + key : p);
    }
  }

  return (
    <Modal show={show} centered backdrop="static" keyboard={false} className="PinModal">
      <Modal.Body>
        <h5 className="PinModal__title">Code PIN</h5>

        <div className="PinModal__dots">
          {Array.from({ length: PIN_LENGTH }).map((_, i) => (
            <span
              key={i}
              className={`PinModal__dot${i < pin.length ? ' PinModal__dot--filled' : ''}`}
            />
          ))}
        </div>

        {error && <p className="PinModal__error">{error}</p>}

        <div className="PinModal__keypad">
          {KEYPAD.flat().map((key) => (
            <Button
              key={key}
              variant={key === '⌫' ? 'outline-secondary' : 'outline-primary'}
              disabled={key === '✓' && pin.length < PIN_LENGTH}
              onClick={() => handleKey(key)}
              className="PinModal__key"
            >
              {key}
            </Button>
          ))}
        </div>
      </Modal.Body>
    </Modal>
  );
}
