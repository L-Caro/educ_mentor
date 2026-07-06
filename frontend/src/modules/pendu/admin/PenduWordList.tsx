import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { PenduWord } from '../pendu.type.ts';
import {
  useGetPenduWordsQuery,
  useUpdatePenduWordMutation,
  useDeletePenduWordMutation,
} from '../pendu.api.ts';
import Spinner from 'src/components/common/Spinner.tsx';
import Toggle from 'src/components/common/Toggle.tsx';
import '../_penduAdmin.scss';

const FILTER_LABELS = { all: 'Tous', active: 'Actifs', inactive: 'Inactifs' } as const;

const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Facile',
  normal: 'Normal',
  hard: 'Difficile',
};

export default function PenduWordList() {
  const { data: words = [], isLoading } = useGetPenduWordsQuery(undefined);
  const [updateWord] = useUpdatePenduWordMutation();
  const [deleteWord] = useDeletePenduWordMutation();
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');

  async function toggleActive(word: PenduWord) {
    await updateWord({ id: word.id, is_active: !word.is_active });
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce mot ?')) return;
    await deleteWord(id);
  }

  const filtered = words.filter((word) => {
    if (filterActive === 'active' && !word.is_active) return false;
    if (filterActive === 'inactive' && word.is_active) return false;
    const searchTerm = search.toLowerCase();
    if (searchTerm && !word.word.toLowerCase().includes(searchTerm)) return false;
    return true;
  });

  return (
    <div className="PenduWordList">
      <div className="PenduWordList__header">
        <span className="PenduWordList__count">
          {filtered.length} affiché{filtered.length !== 1 ? 's' : ''}
        </span>
        <Link to="/admin/pendu/mots/nouveau" className="AdminBtn AdminBtn--primary">
          + Ajouter
        </Link>
      </div>

      <div className="PenduWordList__filters">
        <input
          type="text"
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="AdminInput"
        />
        <div className="PenduWordList__filterGroup">
          {(['all', 'active', 'inactive'] as const).map((filterValue) => (
            <button
              key={filterValue}
              onClick={() => setFilterActive(filterValue)}
              className={`PenduWordList__filterBtn${filterActive === filterValue ? ' PenduWordList__filterBtn--active' : ''}`}
            >
              {FILTER_LABELS[filterValue]}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <Spinner size="sm" />
      ) : (
        <div className="AdminTable">
          <div className="AdminTable__wrap">
            <table>
              <thead>
                <tr>
                  <th>Mot</th>
                  <th>Difficulté</th>
                  <th>Actif</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((word) => (
                  <tr key={word.id}>
                    <td className="PenduWordList__cellWord">{word.word}</td>
                    <td>
                      <span className={`PenduWordList__diffBadge PenduWordList__diffBadge--${word.difficulty}`}>
                        {DIFFICULTY_LABELS[word.difficulty] ?? word.difficulty}
                      </span>
                    </td>
                    <td>
                      <Toggle checked={word.is_active} onChange={() => toggleActive(word)} />
                    </td>
                    <td>
                      <div className="AdminTable__actions">
                        <Link to={`/admin/pendu/mots/${word.id}`} className="AdminBtn AdminBtn--ghost">
                          Éditer
                        </Link>
                        <button
                          onClick={() => handleDelete(word.id)}
                          className="AdminBtn AdminBtn--danger-ghost"
                        >
                          Suppr.
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <p className="AdminTable__empty">Aucun mot trouvé.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}