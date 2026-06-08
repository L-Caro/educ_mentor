import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'src/hook/useAuth';
import PinModal from './PinModal';

/**
 * Bouton discret fixé en bas à droite de la vue enfant.
 * Si déjà authentifié → redirige vers /settings directement.
 * Sinon → ouvre la modale PIN.
 */
export default function GearButton() {
  const { isAuthenticated, login } = useAuth();
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  function handleClick() {
    if (isAuthenticated) {
      navigate('/admin');
    } else {
      setShowPin(true);
    }
  }

  async function handleSubmit(pin: string) {
    setError('');
    try {
      await login(pin);
      setShowPin(false);
      navigate('/admin');
    } catch {
      setError('PIN incorrect');
    }
  }

  return (
    <>
      <button className="GearButton" onClick={handleClick} aria-label="Paramètres">
        ⚙️
      </button>
      <PinModal show={showPin} onSubmit={handleSubmit} error={error} />
    </>
  );
}
