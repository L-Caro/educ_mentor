import { useResetPenduProgressionMutation } from '../pendu.api.ts';

export default function PenduSettings() {
  const [reset, { isLoading }] = useResetPenduProgressionMutation();

  function handleReset() {
    if (!confirm('Supprimer tout l\'historique des parties Pendu ?')) return;
    reset();
  }

  return (
    <div className="GameSettings">
      <div className="GameSettings__header">
        <p className="GameSettings__hint">Historique des parties du Pendu.</p>
      </div>
      <div className="GameSettings__grid">
        <div className="AdminCard GameSettings__card">
          <p className="GameSettings__cardTitle">Progression</p>
          <button className="AdminBtn AdminBtn--danger" onClick={handleReset} disabled={isLoading}>
            Réinitialiser la progression
          </button>
        </div>
      </div>
    </div>
  );
}