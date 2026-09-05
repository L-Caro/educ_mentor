import { useRef, useState } from 'react';
import {
  useGetInvitationsQuery,
  useCreateInvitationMutation,
  useDeleteInvitationMutation,
} from 'src/store/api/authApi.ts';
import Spinner from 'src/components/common/Spinner.tsx';

const InvitationsAdmin = () => {
  const { data: invitations = [], isLoading } = useGetInvitationsQuery();
  const [createInvitation, { isLoading: creating }] = useCreateInvitationMutation();
  const [deleteInvitation] = useDeleteInvitationMutation();
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const labelInputRef = useRef<HTMLInputElement>(null);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    const label = labelInputRef.current?.value.trim();
    if (!label) return;
    setGeneratedLink(null);
    setCopied(false);
    const invitation = await createInvitation({ label }).unwrap();
    setGeneratedLink(invitation.link);
    if (labelInputRef.current) labelInputRef.current.value = '';
  }

  function handleCopy() {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink).then(() => setCopied(true));
  }

  async function handleDelete(invitationId: string) {
    await deleteInvitation(invitationId);
  }

  if (isLoading) return <Spinner size="sm" />;

  return (
    <div className="InvitationsAdmin">
      <div className="Settings__section">
        <p className="Settings__cardTitle">Générer un lien</p>
        <p className="InvitationsAdmin__hint">
          Un lien par appareil : usage unique. L'accès devient permanent après validation.
        </p>
        <form onSubmit={handleCreate} className="InvitationsAdmin__form">
          <input
            ref={labelInputRef}
            type="text"
            className="InvitationsAdmin__input"
            placeholder="ex : Tablette Maëve"
            maxLength={50}
            required
          />
          <button type="submit" className="InvitationsAdmin__btn" disabled={creating}>
            {creating ? <Spinner size="xs" /> : 'Générer'}
          </button>
        </form>

        {generatedLink && (
          <div className="InvitationsAdmin__linkBox">
            <span className="InvitationsAdmin__linkText">{generatedLink}</span>
            <button
              type="button"
              className={`InvitationsAdmin__copyBtn${copied ? ' InvitationsAdmin__copyBtn--done' : ''}`}
              onClick={handleCopy}
            >
              {copied ? '✓' : 'Copier'}
            </button>
          </div>
        )}
      </div>

      {invitations.length > 0 && (
        <div className="Settings__section">
          <p className="Settings__cardTitle">Appareils ({invitations.length})</p>
          <ul className="InvitationsAdmin__list">
            {invitations.map((invitation) => (
              <li key={invitation.id} className="InvitationsAdmin__item">
                <span className="InvitationsAdmin__itemLabel">{invitation.label}</span>
                <span className="InvitationsAdmin__itemMeta">
                  {new Date(invitation.created_at).toLocaleDateString('fr-FR')}
                </span>
                <span className={`InvitationsAdmin__badge${invitation.used_at ? ' InvitationsAdmin__badge--active' : ''}`}>
                  {invitation.used_at ? '✓' : '⏳'}
                </span>
                <button
                  type="button"
                  className="InvitationsAdmin__deleteBtn"
                  onClick={() => handleDelete(invitation.id)}
                  aria-label={`Supprimer ${invitation.label}`}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default InvitationsAdmin;
