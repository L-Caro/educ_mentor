import { useEffect, useState } from 'react';
import { getTablesProgression, resetTablesProgression } from 'src/api/tables.api';
import type { TablesProgression } from 'src/types';
import Spinner from 'src/components/common/Spinner';

export default function TablesProgressionView() {
  const [data, setData] = useState<TablesProgression[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const result = await getTablesProgression();
    setData(result);
    setLoading(false);
  }

  async function handleReset() {
    if (!confirm('Réinitialiser toute la progression des tables ? Action irréversible.')) return;
    await resetTablesProgression();
    await load();
  }

  const mastered = data.filter((p) => p.is_mastered).length;
  const seen = data.filter((p) => !p.is_mastered && (p.correct_count > 0 || p.incorrect_count > 0)).length;
  const total = 66; // unique normalized facts from ×0 to ×10

  // Group by table (factor_a)
  const byTable = new Map<number, TablesProgression[]>();
  for (const p of data) {
    const key = p.factor_a;
    if (!byTable.has(key)) byTable.set(key, []);
    byTable.get(key)!.push(p);
  }

  return (
    <div className="TablesProgression">
      <div className="TablesProgression__header">
        <div className="TablesProgression__stats">
          <span className="AdminBadge AdminBadge--success">{mastered} faits maîtrisés</span>
          <span className="AdminBadge AdminBadge--warning">{seen} en cours</span>
          <span className="AdminBadge AdminBadge--neutral">{total - mastered - seen} non vus</span>
        </div>
        <button onClick={handleReset} className="AdminBtn AdminBtn--danger">
          Réinitialiser
        </button>
      </div>

      {loading ? (
        <Spinner size="sm" />
      ) : data.length === 0 ? (
        <p className="TablesProgression__empty">Aucune progression enregistrée pour l'instant.</p>
      ) : (
        <div className="AdminTable">
          <div className="AdminTable__wrap">
            <table>
              <thead>
                <tr>
                  <th>Fait</th>
                  <th>Résultat</th>
                  <th style={{ textAlign: 'center' }}>✅</th>
                  <th style={{ textAlign: 'center' }}>❌</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {data.map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                      {p.factor_a} × {p.factor_b}
                    </td>
                    <td style={{ color: 'var(--color-base-content)', opacity: 0.7 }}>
                      = {p.factor_a * p.factor_b}
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--color-success)', fontWeight: 600 }}>
                      {p.correct_count}
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--color-error)', fontWeight: 600 }}>
                      {p.incorrect_count}
                    </td>
                    <td>
                      {p.is_mastered
                        ? <span className="AdminBadge AdminBadge--success">Maîtrisé</span>
                        : p.correct_count > 0 || p.incorrect_count > 0
                        ? <span className="AdminBadge AdminBadge--warning">En cours</span>
                        : <span className="AdminBadge AdminBadge--neutral">Non vu</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
