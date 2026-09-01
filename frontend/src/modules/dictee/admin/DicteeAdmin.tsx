import { useMemo, useState } from 'react';
import Button from 'src/components/common/Button';
import Spinner from 'src/components/common/Spinner';
import {
  useDeleteDicteeItemMutation,
  useGetDicteeItemsQuery,
  useGetDicteeWordErrorsQuery,
  useImportDicteeJsonMutation,
  useUpdateDicteeItemMutation,
} from '../dictee.api';
import type { DicteeImportReport, DicteeItem, DicteeNiveau } from '../dictee.type';
import '../dictee.scss';

const NIVEAU_LABEL: Record<DicteeNiveau, string> = {
  debutant: 'Débutant · mots',
  normal: 'Normal · phrases',
  difficile: 'Difficile · paragraphes',
};
const NIVEAU_ORDER: DicteeNiveau[] = ['debutant', 'normal', 'difficile'];

// ─── Import ───────────────────────────────────────────────────────────────────

function ImportForm({ onClose }: { onClose: () => void }) {
  const [importJson, { isLoading }] = useImportDicteeJsonMutation();
  const [raw, setRaw] = useState('');
  const [replace, setReplace] = useState(false);
  const [activate, setActivate] = useState(true);
  const [report, setReport] = useState<DicteeImportReport | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleImport() {
    setError(null);
    setReport(null);
    try {
      JSON.parse(raw);
    } catch {
      setError('JSON invalide : vérifiez la syntaxe.');
      return;
    }
    const result = await importJson({ json: raw, replace, activate }).unwrap();
    setReport(result);
    if (result.errors.length === 0 && result.inserted > 0) setRaw('');
  }

  return (
    <div className="AdminCard DicteeAdmin__import">
      <textarea
        className="AdminInput DicteeAdmin__textarea"
        placeholder={'{\n  "items": [\n    { "niveau": "debutant", "contenu": "cheval", "notions": ["son [ʃ] : ch"] }\n  ]\n}'}
        value={raw}
        onChange={(event) => {
          setRaw(event.target.value);
          setError(null);
        }}
        spellCheck={false}
        disabled={isLoading}
      />

      <label className="DicteeAdmin__check">
        <input
          type="checkbox"
          checked={replace}
          onChange={(event) => setReplace(event.target.checked)}
        />
        <span>Remplacer tout le contenu existant</span>
      </label>
      <label className="DicteeAdmin__check">
        <input
          type="checkbox"
          checked={activate}
          onChange={(event) => setActivate(event.target.checked)}
        />
        <span>Activer les items importés</span>
      </label>

      {error && <p className="DicteeAdmin__error">{error}</p>}
      {report && (
        <div className="DicteeAdmin__report">
          <p>
            {report.inserted} ajouté{report.inserted > 1 ? 's' : ''}
            {report.skipped > 0 && `, ${report.skipped} ignoré(s)`}
            {report.replaced && ' · contenu remplacé'}
          </p>
          {report.errors.map((message, index) => (
            <p key={index} className="DicteeAdmin__error">
              {message}
            </p>
          ))}
        </div>
      )}

      <div className="DicteeAdmin__actions">
        <Button size="sm" variant="primary" onClick={handleImport} disabled={isLoading || !raw.trim()}>
          {isLoading ? 'Import…' : 'Importer'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onClose} disabled={isLoading}>
          Fermer
        </Button>
      </div>
    </div>
  );
}

// ─── Liste d'items ────────────────────────────────────────────────────────────

function ItemRow({ item }: { item: DicteeItem }) {
  const [updateItem] = useUpdateDicteeItemMutation();
  const [deleteItem] = useDeleteDicteeItemMutation();

  return (
    <div className="DicteeAdmin__item">
      <div className="DicteeAdmin__itemMain">
        <span
          className={`AdminBadge ${item.is_active ? 'AdminBadge--success' : 'AdminBadge--neutral'}`}
        >
          {item.is_active ? 'Actif' : 'Inactif'}
        </span>
        <p className="DicteeAdmin__itemContenu">{item.contenu}</p>
      </div>
      {item.notions.length > 0 && (
        <p className="DicteeAdmin__itemNotions">{item.notions.join(' · ')}</p>
      )}
      <div className="DicteeAdmin__actions">
        <Button
          size="sm"
          variant="outline"
          onClick={() => updateItem({ id: item.id, is_active: !item.is_active })}
        >
          {item.is_active ? 'Désactiver' : 'Activer'}
        </Button>
        <Button
          size="sm"
          variant="danger-ghost"
          onClick={() => deleteItem(item.id)}
        >
          Supprimer
        </Button>
      </div>
    </div>
  );
}

// ─── Mots à retravailler ──────────────────────────────────────────────────────

function WordErrors() {
  const { data: errors = [] } = useGetDicteeWordErrorsQuery();
  if (errors.length === 0) return null;

  return (
    <div className="AdminCard">
      <h3 className="DicteeAdmin__sectionTitle">Mots à retravailler</h3>
      <table className="DicteeAdmin__table">
        <thead>
          <tr>
            <th>Mot</th>
            <th>Ratés</th>
            <th>Réussis</th>
          </tr>
        </thead>
        <tbody>
          {errors.map((entry) => (
            <tr key={entry.word}>
              <td>{entry.word}</td>
              <td>{entry.incorrect_count}</td>
              <td>{entry.correct_count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DicteeAdmin() {
  const { data: items = [], isLoading } = useGetDicteeItemsQuery();
  const [showImport, setShowImport] = useState(false);

  const byNiveau = useMemo(() => {
    const groups: Record<DicteeNiveau, DicteeItem[]> = {
      debutant: [],
      normal: [],
      difficile: [],
    };
    for (const item of items) {
      if (groups[item.niveau]) groups[item.niveau].push(item);
    }
    return groups;
  }, [items]);

  if (isLoading) return <Spinner size="sm" />;

  return (
    <div className="DicteeAdmin">
      <div className="DicteeAdmin__header">
        <h2 className="DicteeAdmin__title">Contenu des dictées</h2>
        {!showImport && (
          <Button size="sm" variant="primary" onClick={() => setShowImport(true)}>
            Importer un JSON
          </Button>
        )}
      </div>

      {showImport && <ImportForm onClose={() => setShowImport(false)} />}

      {items.length === 0 && !showImport && (
        <p className="DicteeAdmin__empty">
          Aucun contenu. Générez une dictée avec le skill puis importez le JSON.
        </p>
      )}

      {NIVEAU_ORDER.map((niveau) => {
        const group = byNiveau[niveau];
        if (group.length === 0) return null;
        const activeCount = group.filter((item) => item.is_active).length;
        return (
          <div key={niveau} className="AdminCard">
            <h3 className="DicteeAdmin__sectionTitle">
              {NIVEAU_LABEL[niveau]}
              <span className="DicteeAdmin__count">
                {activeCount} / {group.length} actifs
              </span>
            </h3>
            {group.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
          </div>
        );
      })}

      <WordErrors />
    </div>
  );
}
