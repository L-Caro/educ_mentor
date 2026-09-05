import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import Spinner from 'src/components/common/Spinner';

type InviteStatus = 'loading' | 'redirecting' | 'invalid' | 'already_used' | 'error';

/** Valide le token d'invitation, pose le cookie access_token via l'API,
 * puis redirige vers / : l'AccessGate laissera passer au prochain check. */
const InvitePage = () => {
  const { token } = useParams<{ token: string }>();
  const [inviteStatus, setInviteStatus] = useState<InviteStatus>(() => (token ? 'loading' : 'invalid'));

  useEffect(() => {
    if (!token) return;

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
  }, [token]);

  if (inviteStatus === 'loading' || inviteStatus === 'redirecting') {
    return (
      <div className="AccessState">
        <Spinner />
      </div>
    );
  }

  const messages: Record<Exclude<InviteStatus, 'loading' | 'redirecting'>, { title: string; detail: string }> = {
    invalid: {
      title: 'Lien invalide',
      detail: "Ce lien d'invitation n'existe pas ou a expiré.",
    },
    already_used: {
      title: 'Lien déjà utilisé',
      detail: "Ce lien a déjà été utilisé sur un autre appareil. Demande un nouveau lien à Lionel.",
    },
    error: {
      title: 'Erreur',
      detail: 'Une erreur est survenue. Vérifie ta connexion et réessaie.',
    },
  };

  const { title, detail } = messages[inviteStatus];

  return (
    <div className="AccessState">
      <p className="AccessState__emoji">❌</p>
      <h1 className="AccessState__title">{title}</h1>
      <p className="AccessState__text">{detail}</p>
    </div>
  );
};

export default InvitePage;
