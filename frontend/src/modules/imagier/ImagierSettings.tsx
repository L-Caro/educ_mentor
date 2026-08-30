import { useRef, useState } from 'react';
import {
  useImportImagierJsonMutation,
  useNormalizeImagierCategoriesMutation,
} from './imagier.api.ts';
import Spinner from 'src/components/common/Spinner.tsx';

type ImportReport = {
  inserted: number;
  skipped: number;
  replaced: boolean;
  errors: string[];
};

export default function ImagierSettings() {
  const [normalizeCategories, { isLoading: normalizing }] = useNormalizeImagierCategoriesMutation();
  const [normalizeResult, setNormalizeResult] = useState<number | null>(null);

  const [importJson, { isLoading: importing }] = useImportImagierJsonMutation();
  const [replace, setReplace] = useState(false);
  const [activate, setActivate] = useState(true);
  const [report, setReport] = useState<ImportReport | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function handleNormalizeCategories() {
    setNormalizeResult(null);
    const result = await normalizeCategories().unwrap();
    setNormalizeResult(result.updated);
  }

  async function handleImportFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setReport(null);
    setImportError(null);
    if (replace && !confirm('Remplacer TOUT le contenu de l\'imagier (mots + progression) ?')) return;

    try {
      const json = await file.text();
      setReport(await importJson({ json, replace, activate }).unwrap());
    } catch {
      setImportError('Import impossible : fichier illisible ou serveur en erreur.');
    }
  }

  return (
    <div className="GameSettings">
      <div className="GameSettings__header">
        <p className="GameSettings__hint">Gestion des mots et des images de l'imagier.</p>
      </div>

      <div className="GameSettings__grid">
        <div className="AdminCard GameSettings__card">
          <p className="GameSettings__cardTitle">Import d'un dictionnaire</p>
          <p className="GameSettings__hint">
            Fichier <code>dictionnaire_thematique.json</code> (catégorie → sous-catégorie → mots).
            Les images doivent déjà être dans <code>data/images/imagier/&lt;catégorie&gt;/</code>.
          </p>

          <label className="GameSettings__toggleRow">
            <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} />
            <span>Remplacer tout le contenu existant</span>
          </label>
          <label className="GameSettings__toggleRow">
            <input type="checkbox" checked={activate} onChange={(e) => setActivate(e.target.checked)} />
            <span>Activer les mots importés</span>
          </label>

          <div className="GameSettings__toggleRow">
            <button
              onClick={() => fileRef.current?.click()}
              disabled={importing}
              className="AdminBtn AdminBtn--primary"
            >
              {importing ? <Spinner size="xs" /> : 'Choisir le fichier…'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              onChange={handleImportFile}
              style={{ display: 'none' }}
            />
          </div>

          {importError && <p className="GameSettings__error">{importError}</p>}
          {report && (
            <div className="GameSettings__hint">
              {report.replaced && <>Contenu remplacé. </>}
              {report.inserted} importé{report.inserted !== 1 ? 's' : ''}, {report.skipped} ignoré
              {report.skipped !== 1 ? 's' : ''}.
              {report.errors.length > 0 && (
                <ul>
                  {report.errors.slice(0, 10).map((error, index) => (
                    <li key={index}>{error}</li>
                  ))}
                  {report.errors.length > 10 && <li>… {report.errors.length - 10} autres</li>}
                </ul>
              )}
            </div>
          )}
        </div>

        <div className="AdminCard GameSettings__card">
          <p className="GameSettings__cardTitle">Maintenance</p>
          <p className="GameSettings__hint">
            Normalise les noms de catégories en base (minuscules, tirets). À appeler une fois après un import.
          </p>
          <div className="GameSettings__toggleRow">
            <button
              onClick={handleNormalizeCategories}
              disabled={normalizing}
              className="AdminBtn AdminBtn--ghost"
            >
              {normalizing ? <Spinner size="xs" /> : 'Normaliser les catégories'}
            </button>
            {normalizeResult !== null && (
              <span className="GameSettings__succes">
                {normalizeResult} mot{normalizeResult !== 1 ? 's' : ''} mis à jour
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
