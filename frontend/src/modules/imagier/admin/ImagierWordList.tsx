import { useState } from 'react';
import { Link } from 'react-router-dom';
import type { ImagierWord } from "src/modules/imagier/imagier.type.ts";
import { useGetImagierWordsQuery, useUpdateImagierWordMutation, useDeleteImagierWordMutation } from '../imagier.api.ts';
import Badge from 'src/components/common/Badge.tsx';
import Spinner from 'src/components/common/Spinner.tsx';
import Toggle from 'src/components/common/Toggle.tsx';
import '../_imagierAdmin.scss'

const FILTER_LABELS = { all: 'Tous', active: 'Actifs', inactive: 'Inactifs' } as const;

export default function ImagierWordList() {
  const { data: words = [], isLoading } = useGetImagierWordsQuery();
  const [updateWord] = useUpdateImagierWordMutation();
  const [deleteWord] = useDeleteImagierWordMutation();
  const [search, setSearch] = useState('');
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [filterCategory, setFilterCategory] = useState('');

  const categories = [...new Set(words.map((word) => word.category))].sort();

  async function toggleActive(word: ImagierWord) {
    await updateWord({ id: word.id, is_active: !word.is_active });
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer ce mot et sa progression ?')) return;
    await deleteWord(id);
  }

  const filtered = words.filter((word) => {
    if (filterCategory && word.category !== filterCategory) return false;
    if (filterActive === 'active' && !word.is_active) return false;
    if (filterActive === 'inactive' && word.is_active) return false;
    const searchTerm = search.toLowerCase();
    if (searchTerm && !word.fr.toLowerCase().includes(searchTerm) && !word.en.toLowerCase().includes(searchTerm)) return false;
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
          {(['all', 'active', 'inactive'] as const).map((filterValue) => (
            <button
              key={filterValue}
              onClick={() => setFilterActive(filterValue)}
              className={`ImagierWordList__filterBtn${filterActive === filterValue ? ' ImagierWordList__filterBtn--active' : ''}`}
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
