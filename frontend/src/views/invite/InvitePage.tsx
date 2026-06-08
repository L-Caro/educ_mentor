import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';

type InviteStatus = 'loading' | 'redirecting' | 'invalid' | 'already_used' | 'error';

/** Valide le token d'invitation, pose le cookie access_token via l'API,
 * puis redirige vers / — l'AccessGate laissera passer au prochain check. */
const InvitePage = () => {
  const { token } = useParams<{ token: string }>();
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>('loading');

  useEffect(() => {
    if (!token) {
      setInviteStatus('invalid');
      return;
    }

    fetch(`/api/auth/invite/${token}`)
      .then(async response => {
        if (response.ok) {
          setInviteStatus('redirecting');
          // Rechargement complet : AccessGate re-check avec le cookie maintenant posé
          window.location.href = '/';
          return;
        }
        const data = await response.json().catch(() => ({}));
        const message = data?.message ?? '';
        setInviteStatus(message.includes('déjà') ? 'already_used' : 'invalid');
      })
      .catch(() => setInviteStatus('error'));
  }, [token, navigate]);

  if (inviteStatus === 'loading' || inviteStatus === 'redirecting') {
    return (
      <div className="d-flex align-items-center justify-content-center vh-100">
        <div className="spinner-border text-primary" role="status" />
      </div>
    );
  }

  const messages: Record<Exclude<InviteStatus, 'loading' | 'redirecting'>, { title: string; detail: string }> = {
    invalid: {
      title: 'Lien invalide',
      detail: 'Ce lien d'invitation n'existe pas ou a expiré.',
    },
    already_used: {
      title: 'Lien déjà utilisé',
      detail: 'Ce lien a déjà été utilisé sur un autre appareil. Demande un nouveau lien à Lionel.',
    },
    error: {
      title: 'Erreur',
      detail: 'Une erreur est survenue. Vérifie ta connexion et réessaie.',
    },
  };

  const { title, detail } = messages[inviteStatus];

  return (
    <div className="d-flex flex-column align-items-center justify-content-center vh-100 text-center px-4">
      <p className="display-3">❌</p>
      <h1 className="h3 mb-3">{title}</h1>
      <p className="text-muted">{detail}</p>
    </div>
  );
};

export default InvitePage;
