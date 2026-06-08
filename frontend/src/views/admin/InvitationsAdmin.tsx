import { useEffect, useRef, useState } from 'react';
import { createInvitation, fetchInvitations, type Invitation } from 'src/api/invitation.api';
import Spinner from 'src/components/common/Spinner';

const InvitationsAdmin = () => {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchInvitations()
      .then(setInvitations)
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const label = labelInputRef.current?.value.trim();
    if (!label) return;

    setCreating(true);
    setGeneratedLink(null);
    setCopied(false);

    const invitation = await createInvitation(label);
    setInvitations(previous => [invitation, ...previous]);
    setGeneratedLink(invitation.link);
    if (labelInputRef.current) labelInputRef.current.value = '';
    setCreating(false);
  }

  function handleCopy() {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink).then(() => setCopied(true));
  }

  if (loading) return <Spinner size="sm" />;

  return (
    <div className="InvitationsAdmin">
      <div className="AdminCard mb-4">
        <h2 className="h6 mb-3">Générer un lien d'invitation</h2>
        <p className="text-muted small mb-3">
          Un lien par appareil. Le destinataire clique une fois — l'accès est ensuite permanent sur cet appareil.
        </p>
        <form onSubmit={handleCreate} className="d-flex gap-2 align-items-end">
          <div className="flex-grow-1">
            <label htmlFor="invitation-label" className="form-label small">Nom de l'appareil</label>
            <input
              id="invitation-label"
              ref={labelInputRef}
              type="text"
              className="form-control"
              placeholder="ex : Tablette Maëve, iPad salon"
              maxLength={50}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={creating}>
            {creating ? <Spinner size="xs" /> : 'Générer'}
          </button>
        </form>

        {generatedLink && (
          <div className="mt-3 p-3 bg-light rounded">
            <p className="small text-muted mb-1">Lien à envoyer par mail :</p>
            <div className="d-flex gap-2 align-items-center">
              <code className="flex-grow-1 text-break small">{generatedLink}</code>
              <button
                type="button"
                className={`btn btn-sm ${copied ? 'btn-success' : 'btn-outline-secondary'}`}
                onClick={handleCopy}
              >
                {copied ? '✓ Copié' : 'Copier'}
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="AdminCard">
        <h2 className="h6 mb-3">Appareils invités ({invitations.length})</h2>
        {invitations.length === 0 ? (
          <p className="text-muted small">Aucun appareil invité pour l'instant.</p>
        ) : (
          <table className="table table-sm">
            <thead>
              <tr>
                <th>Appareil</th>
                <th>Invité le</th>
                <th>Statut</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map(invitation => (
                <tr key={invitation.id}>
                  <td>{invitation.label}</td>
                  <td className="text-muted small">
                    {new Date(invitation.created_at).toLocaleDateString('fr-FR')}
                  </td>
                  <td>
                    {invitation.used_at ? (
                      <span className="badge bg-success">Activé</span>
                    ) : (
                      <span className="badge bg-warning text-dark">En attente</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default InvitationsAdmin;
