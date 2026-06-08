import { useRef, useState } from 'react';
import { importJson } from 'src/api/imagier.api';
import Spinner from 'src/components/common/Spinner';

interface Report { inserted: number; skipped: number; errors: string[]; }

export default function ImagierImport() {
  const [jsonText, setJsonText] = useState('');
  const [overwrite, setOverwrite] = useState(false);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function handleFileLoad(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setJsonText(ev.target?.result as string ?? '');
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!jsonText.trim()) return;
    setLoading(true);
    setReport(null);
    try { setReport(await importJson(jsonText, overwrite)); }
    finally { setLoading(false); }
  }

  return (
    <div className="ImagierImport">
      <p className="ImagierImport__hint">
        Structure attendue :{' '}
        <code className="ImagierImport__code">
          dictionnaire_thematique → catégorie → sous-catégorie → fr: en
        </code>
      </p>

      <div className="AdminCard ImagierImport__fields">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="AdminBtn AdminBtn--outline"
          >
            📂 Charger un fichier .json
          </button>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFileLoad} style={{ display: 'none' }} />
          {jsonText && (
            <span className="AdminBadge AdminBadge--success">✓ {jsonText.length} caractères</span>
          )}
        </div>

        <textarea
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
          placeholder='{"dictionnaire_thematique": {"animaux": {"mammiferes": {"chat": "cat"}}}}'
          rows={6}
          className="ImagierImport__textarea"
        />

        <label className="ImagierImport__checkRow">
          <input
            type="checkbox"
            checked={overwrite}
            onChange={(e) => setOverwrite(e.target.checked)}
          />
          <span>Écraser les mots existants (même slug)</span>
        </label>

        <button
          onClick={handleImport}
          disabled={loading || !jsonText.trim()}
          className="AdminBtn AdminBtn--primary"
        >
          {loading
            ? <><Spinner size="xs" /> Import en cours…</>
            : 'Importer'
          }
        </button>

        {report && (
          <div className={`ImagierImport__report ImagierImport__report--${report.errors.length > 0 ? 'warning' : 'success'}`}>
            <p className="ImagierImport__reportTitle">
              {report.errors.length === 0 ? '✅ Import terminé' : '⚠️ Import terminé avec des erreurs'}
            </p>
            <p className="ImagierImport__reportStats">
              Insérés / mis à jour : <strong>{report.inserted}</strong> · Ignorés : <strong>{report.skipped}</strong>
            </p>
            {report.errors.length > 0 && (
              <ul className="ImagierImport__reportErrors">
                {report.errors.map((e, i) => <li key={i}>• {e}</li>)}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
