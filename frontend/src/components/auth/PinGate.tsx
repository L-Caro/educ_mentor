import { useState, type ReactNode } from 'react';
import { useAuth } from 'src/hooks/useAuth';
import PinModal from './PinModal';

interface PinGateProps {
  children: ReactNode;
}

/**
 * Protège une route par PIN.
 * Si déjà authentifié (token Redux valide) → affiche le contenu.
 * Sinon → affiche PinModal jusqu'à validation.
 * En dev (ADMIN_PIN_ENABLED=false), le backend retourne un token
 * sans vérification → n'importe quel PIN déverrouille.
 */
export default function PinGate({ children }: PinGateProps) {
  const { isAuthenticated, login } = useAuth();
  const [error, setError] = useState('');


  if (isAuthenticated) return <>{children}</>;

  async function handleSubmit(pin: string) {
    setError('');
    try {
      await login(pin);
    } catch {
      setError('PIN incorrect');
    }
  }

  return <PinModal show={true} onSubmit={handleSubmit} error={error} />;
}
