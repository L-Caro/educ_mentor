import { useEffect, useState } from 'react';
import { getMonnaieProgression, resetMonnaieProgression } from 'src/api/monnaie.api';
import type { MonnaieProgression } from 'src/types';
import { formatCents } from '../constants/denominations';
import Spinner from 'src/components/common/Spinner';

const EXERCISE_LABELS: Record<string, string> = {
  reconnaitre: '👀 Reconnaître',
  total: '🛒 Total d\'achat',
  rendre: '💸 Rendre la monnaie',
  acheter: '🤔 Puis-je acheter ?',
};

export default function MonnaieProgressionView() {
  const [progression, setProgression] = useState<MonnaieProgression[]>([]);
  const [loading, setLoading] = useState(true);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadProgression();
  }, []);

  async function loadProgression() {
    setLoading(true);
    const data = await getMonnaieProgression().catch(() => []);
    setProgression(data);
    setLoading(false);
  }

  async function handleReset() {
    if (!window.confirm('Remettre toute la progression à zéro ?')) return;
    setResetting(true);
    await resetMonnaieProgression().catch(console.error);
    setProgression([]);
    setResetting(false);
  }

  if (loading) return <Spinner size="sm" />;

  const masteredCount = progression.filter((entry) => entry.is_mastered).length;

  // Grouper par type d'exercice
  const grouped = progression.reduce<Record<string, MonnaieProgression[]>>((accumulator, entry) => {
    const group = accumulator[entry.exercise_type] ?? [];
    group.push(entry);
    return { ...accumulator, [entry.exercise_type]: group };
  }, {});

  return (
    <div className="MonnaieProgression">
      <div className="MonnaieProgression__header">
        <div className="MonnaieProgression__stats">
          <span className="AdminBadge AdminBadge--primary">{progression.length} réponses suivies</span>
          <span className="AdminBadge AdminBadge--success">{masteredCount} maîtrisées</span>
        </div>
        <button
          className="AdminBtn AdminBtn--ghost AdminBtn--sm"
          onClick={handleReset}
          disabled={resetting || progression.length === 0}
        >
          {resetting ? <Spinner size="xs" /> : 'Réinitialiser'}
        </button>
      </div>

      {progression.length === 0 && (
        <p className="MonnaieProgression__empty">Aucune session jouée pour l'instant.</p>
      )}

      {Object.entries(grouped).map(([exerciseType, entries]) => (
        <div key={exerciseType} className="MonnaieProgression__section">
          <p className="MonnaieProgression__sectionTitle">
            {EXERCISE_LABELS[exerciseType] ?? exerciseType}
          </p>
          <table className="MonnaieProgression__table">
            <thead>
              <tr>
                <th>Réponse</th>
                <th>✓</th>
                <th>✗</th>
                <th>Maîtrisé</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry) => (
                <tr key={entry.id} className={entry.is_mastered ? 'MonnaieProgression__row--mastered' : ''}>
                  <td>{formatCents(entry.answer_value)}</td>
                  <td>{entry.correct_count}</td>
                  <td>{entry.incorrect_count}</td>
                  <td>{entry.is_mastered ? '⭐' : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
