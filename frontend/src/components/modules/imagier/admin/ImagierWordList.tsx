import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getWords, updateWord, deleteWord } from 'src/api/imagier.api';
import Badge from 'src/components/common/Badge';
import Spinner from 'src/components/common/Spinner';
import Toggle from 'src/components/common/Toggle';
import type { ImagierWord } from 'src/types';

const FILTER_LABELS = { all: 'Tous', active: 'Actifs', inactive: 'Inactifs' } as const;

export default function ImagierWordList() {
  const [words, setWords] = useState<ImagierWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => { load(); }, []);

  async function load() {
    setLoading(true);
    const data = await getWords();
    setWords(data);
    setCategories([...new Set(data.map((w) => w.category))].sort());
    setLoading(false);
  }

  async function toggleActive(word: ImagierWord) {
    const updated = await updateWord(word.id, { is_active: !word.is_active });
    setWords((prev) => prev.map((w) => (w.id === word.id ? updated : w)));
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce mot et sa progression ?')) return;
    await deleteWord(id);
    setWords((prev) => prev.filter((w) => w.id !== id));
  }

  const filtered = words.filter((w) => {
    if (filterCategory && w.category !== filterCategory) return false;
    if (filterActive === 'active' && !w.is_active) return false;
    if (filterActive === 'inactive' && w.is_active) return false;
    const searchTerm = search.toLowerCase();
    if (searchTerm && !w.fr.toLowerCase().includes(searchTerm) && !w.en.toLowerCase().includes(searchTerm)) return false;
    return true;
  });

  return (
    <div className="ImagierWordList">
      <div className="ImagierWordList__header">
        <span className="ImagierWordList__count">
          {filtered.length} affiché{filtered.length !== 1 ? 's' : ''}
        </span>
        <Link to="/admin/imagier/mots/nouveau" className="AdminBtn AdminBtn--primary">
          + Ajouter
        </Link>
      </div>

      <div className="ImagierWordList__filters">
        <input
          type="text"
          placeholder="Rechercher…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="AdminInput"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="AdminSelect"
        >
          <option value="">Toutes catégories</option>
          {categories.map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <div className="ImagierWordList__filterGroup">
          {(['all', 'active', 'inactive'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setFilterActive(v)}
              className={`ImagierWordList__filterBtn${filterActive === v ? ' ImagierWordList__filterBtn--active' : ''}`}
            >
              {FILTER_LABELS[v]}
            </button>
          ))}
        </div>
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
                  <th>Image</th>
                  <th>Actif</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((word) => (
                  <tr key={word.id}>
                    <td className="ImagierWordList__cellFr">{word.fr}</td>
                    <td className="ImagierWordList__cellEn">{word.en}</td>
                    <td className="ImagierWordList__cellCategory">
                      {word.category}{word.subcategory && ` / ${word.subcategory}`}
                    </td>
                    <td>
                      {word.image_filename
                        ? <Badge variant="success">✓</Badge>
                        : <span className="ImagierWordList__noImage">—</span>}
                    </td>
                    <td>
                      <Toggle checked={word.is_active} onChange={() => toggleActive(word)} />
                    </td>
                    <td>
                      <div className="AdminTable__actions">
                        <Link to={`/admin/imagier/mots/${word.id}`} className="AdminBtn AdminBtn--ghost">
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
