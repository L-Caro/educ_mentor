import { useEffect, useState } from 'react';
import Spinner from 'src/components/common/Spinner';

type AccessStatus = 'loading' | 'redirecting' | 'invalid' | 'error';

/** Page de bootstrap admin. Appelée depuis le lien bookmarqué :
 * https://educmentor.lionelcaro.fr/admin-access?token=SECRET
 * Pose le cookie access_token via l'API, puis redirige vers /admin. */
const AdminAccessPage = () => {
  const [accessStatus, setAccessStatus] = useState<AccessStatus>(() =>
    new URLSearchParams(window.location.search).get('token') ? 'loading' : 'invalid',
  );

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get('token');
    if (!token) return;

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
      <div className="AccessState">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="AccessState">
      <p className="AccessState__emoji">🔐</p>
      <h1 className="AccessState__title">Token invalide</h1>
      <p className="AccessState__text">Vérifie que le lien est complet et réessaie.</p>
    </div>
  );
};

export default AdminAccessPage;
