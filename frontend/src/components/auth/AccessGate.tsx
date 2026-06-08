import { useEffect, useState } from 'react';
import AccessDenied from './AccessDenied';

type AccessStatus = 'loading' | 'authorized' | 'denied';

/** Vérifie au démarrage que l'appareil est autorisé (cookie access_token valide côté backend).
 * Impossible de lire le cookie httpOnly en JS — on le détecte via un appel API :
 * 200 = cookie présent et valide, 401 = accès refusé. */
const AccessGate = ({ children }: { children: React.ReactNode }) => {
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('loading');

  useEffect(() => {
    // Sur /invite/:token, l'app n'a pas encore de cookie — c'est InvitePage qui le pose.
    // On laisse passer : InvitePage fera un rechargement complet après succès.
    if (window.location.pathname.startsWith('/invite/')) {
      setAccessStatus('authorized');
      return;
    }

    fetch('/api/auth/check')
      .then(response => {
        setAccessStatus(response.ok ? 'authorized' : 'denied');
      })
      .catch(() => setAccessStatus('denied'));
  }, []);

  if (accessStatus === 'loading') {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  if (accessStatus === 'denied') return <AccessDenied />;

  return <>{children}</>;
};

export default AccessGate;
