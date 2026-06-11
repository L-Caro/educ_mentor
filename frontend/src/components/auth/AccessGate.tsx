import { useEffect, useState } from 'react';
import AccessDenied from './AccessDenied';
import Spinner from 'src/components/common/Spinner';

type AccessStatus = 'loading' | 'authorized' | 'denied';

/** Vérifie au démarrage que l'appareil est autorisé (cookie access_token valide côté backend).
 * Impossible de lire le cookie httpOnly en JS — on le détecte via un appel API :
 * 200 = cookie présent et valide, 401 = accès refusé. */
/** Cas résolus synchroniquement (dev, pages publiques) → état initial ; sinon on vérifie via l'API. */
function initialAccessStatus(): AccessStatus {
  // En dev, le système d'invitation n'a aucun intérêt — on bypass entièrement.
  if (import.meta.env.DEV) return 'authorized';
  // Sur /invite/:token et /admin-access, l'app n'a pas encore de cookie — ces pages le posent.
  if (window.location.pathname.startsWith('/invite/') || window.location.pathname === '/admin-access') {
    return 'authorized';
  }
  return 'loading';
}

const AccessGate = ({ children }: { children: React.ReactNode }) => {
  const [accessStatus, setAccessStatus] = useState<AccessStatus>(initialAccessStatus);

  useEffect(() => {
    if (accessStatus !== 'loading') return;
    fetch('/api/auth/check')
      .then(response => setAccessStatus(response.ok ? 'authorized' : 'denied'))
      .catch(() => setAccessStatus('denied'));
  }, [accessStatus]);

  if (accessStatus === 'loading') {
    return (
      <div className="AccessState">
        <Spinner />
      </div>
    );
  }

  if (accessStatus === 'denied') return <AccessDenied />;

  return <>{children}</>;
};

export default AccessGate;
