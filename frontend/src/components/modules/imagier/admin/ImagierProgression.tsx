import { useEffect, useState } from 'react';
import { getProgression, resetProgression } from 'src/api/imagier.api';
import Spinner from 'src/components/common/Spinner';
import type { ImagierWord } from 'src/types';

type WordWithProg = ImagierWord & {
  progression: { correct_count: number; incorrect_count: number; is_mastered: boolean } | null;
};

export default function ImagierProgression() {
  const [data, setData] = useState<WordWithProg[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const result = await getProgression();
    setData(result as WordWithProg[]);
    setCategories([...new Set(result.map((w) => w.category))].sort());
    setLoading(false);
  }

  async function handleReset() {
    if (!confirm('Réinitialiser toute la progression ? Action irréversible.')) return;
    await resetProgression();
    await load();
  }

  const filtered = filterCategory ? data.filter((w) => w.category === filterCategory) : data;
  const mastered = data.filter((w) => w.progression?.is_mastered).length;
  const seen = data.filter((w) => w.progression && w.progression.correct_count > 0).length;

  return (
    <div className="ImagierProgression">
      <div className="ImagierProgression__header">
        <div className="ImagierProgression__stats">
          <span className="AdminBadge AdminBadge--success">{mastered} maîtrisés</span>
          <span className="AdminBadge AdminBadge--warning">{seen} vus</span>
          <span className="AdminBadge AdminBadge--neutral">{data.length} total</span>
        </div>
        <button onClick={handleReset} className="AdminBtn AdminBtn--danger">
          Réinitialiser
        </button>
      </div>

      <div className="ImagierProgression__filters">
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="AdminSelect"
        >
          <option value="">Toutes catégories</option>
          {categories.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {loading ? (
        <Spinner size="sm" />
      ) : (
        <div className="AdminTable">
          <div className="AdminTable__wrap">
            <table>
              <thead>
                <tr>
                  <th>Français</th>
                  <th>Anglais</th>
                  <th>Catégorie</th>
                  <th style={{ textAlign: 'center' }}>✅</th>
                  <th style={{ textAlign: 'center' }}>❌</th>
                  <th>Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((word) => (
                  <tr key={word.id}>
                    <td style={{ fontWeight: 600 }}>{word.fr}</td>
                    <td style={{ opacity: 0.5 }}>{word.en}</td>
                    <td style={{ opacity: 0.4, fontSize: '0.8125rem' }}>{word.category}</td>
                    <td style={{ textAlign: 'center', color: 'var(--color-success)', fontWeight: 600 }}>
                      {word.progression?.correct_count ?? 0}
                    </td>
                    <td style={{ textAlign: 'center', color: 'var(--color-error)', fontWeight: 600 }}>
                      {word.progression?.incorrect_count ?? 0}
                    </td>
                    <td>
                      {word.progression?.is_mastered
                        ? <span className="AdminBadge AdminBadge--success">Maîtrisé</span>
                        : word.progression?.correct_count
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
