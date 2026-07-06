import { useResetMemoryProgressionMutation } from '../memory.api';

export default function MemoryAdmin() {
  const [reset, { isLoading }] = useResetMemoryProgressionMutation();

  function handleReset() {
    if (!confirm('Supprimer tout l\'historique des parties Memory ? Action irréversible.')) return;
    reset();
  }

  return (
    <div className="GameSettings">
      <div className="GameSettings__header">
        <p className="GameSettings__hint">Historique et progression du jeu Memory.</p>
      </div>

      <div className="GameSettings__grid">
        <div className="AdminCard GameSettings__card">
          <p className="GameSettings__cardTitle">Progression</p>
          <p style={{ fontSize: '0.875rem', marginBottom: '1rem', opacity: 0.7 }}>
            Supprimer l&apos;historique de toutes les parties jouées.
          </p>
          <button className="AdminBtn AdminBtn--danger" onClick={handleReset} disabled={isLoading}>
            Réinitialiser la progression
          </button>
        </div>
      </div>
    </div>
  );
}