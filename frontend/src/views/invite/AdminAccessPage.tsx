import { useEffect, useState } from 'react';

type AccessStatus = 'loading' | 'redirecting' | 'invalid' | 'error';

/** Page de bootstrap admin. Appelée depuis le lien bookmarqué :
 * https://educmentor.lionelcaro.fr/admin-access?token=SECRET
 * Pose le cookie access_token via l'API, puis redirige vers /admin. */
const AdminAccessPage = () => {
  const [accessStatus, setAccessStatus] = useState<AccessStatus>('loading');

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) {
      setAccessStatus('invalid');
      return;
    }

    fetch(`/api/auth/admin-access?token=${encodeURIComponent(token)}`)
      .then(response => {
        if (response.ok) {
          setAccessStatus('redirecting');
          window.location.href = '/admin';
          return;
        }
        setAccessStatus('invalid');
      })
      .catch(() => setAccessStatus('error'));
  }, []);

  if (accessStatus === 'loading' || accessStatus === 'redirecting') {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100 text-center px-4">
      <p className="display-3">🔐</p>
      <h1 className="h3 mb-3">Token invalide</h1>
      <p className="text-muted">Vérifie que le lien est complet et réessaie.</p>
    </div>
  );
};

export default AdminAccessPage;
