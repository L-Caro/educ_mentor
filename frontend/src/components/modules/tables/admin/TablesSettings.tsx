import { useGetSettingsQuery, useUpdateSettingMutation } from 'src/store/api/api';
import Spinner from 'src/components/common/Spinner';

const ALL_TABLES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const THRESHOLDS = [2, 3, 5];

export default function TablesSettings() {
  const { data: settings = {}, isLoading: loading } = useGetSettingsQuery();
  const [updateSetting, { isLoading: saving }] = useUpdateSettingMutation();

  if (loading) return <Spinner size="sm" />;

  const threshold = parseInt(settings.tables_mastery_threshold ?? '3', 10);
  const knownTables: number[] = JSON.parse(settings.tables_known_tables ?? '[0,1,2,5,9,10]');
  const choiceCount     = settings.tables_choice_count ?? '4';
  const hintsEnabled    = settings.tables_hints_enabled !== 'false';
  const includeTrivial  = settings.tables_include_trivial !== 'false';

  function toggleKnown(t: number) {
    const next = knownTables.includes(t)
      ? knownTables.filter((x) => x !== t)
      : [...knownTables, t].sort((a, b) => a - b);
    updateSetting({ key: 'tables_known_tables', value: JSON.stringify(next) });
  }

  return (
    <div className="TablesSettings">
      <div className="TablesSettings__header">
        <p className="TablesSettings__hint">
          Ces paramètres s'appliquent à la session de jeu de Maëve.
        </p>
        {saving && <Spinner size="xs" />}
      </div>

      <div className="TablesSettings__grid">
        {/* Mode de réponse */}
        <div className="AdminCard TablesSettings__card">
          <p className="TablesSettings__cardTitle">Mode de réponse</p>
          <div className="TablesSettings__radios">
            {([['4', '4 choix (facile)'], ['2', '2 choix (intermédiaire)'], ['free', 'Saisie libre (difficile)']] as const).map(([val, label]) => (
              <label key={val} className="TablesSettings__radio">
                <input
                  type="radio"
                  name="tables-choice-count"
                  value={val}
                  checked={choiceCount === val}
                  onChange={() => updateSetting({ key: 'tables_choice_count', value: val })}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Seuil de maîtrise */}
        <div className="AdminCard TablesSettings__card">
          <p className="TablesSettings__cardTitle">Bonnes réponses pour maîtriser un fait</p>
          <div className="TablesSettings__radios">
            {THRESHOLDS.map((val) => (
              <label key={val} className="TablesSettings__radio">
                <input
                  type="radio"
                  name="tables-threshold"
                  value={val}
                  checked={threshold === val}
                  onChange={() => updateSetting({ key: 'tables_mastery_threshold', value: String(val) })}
                />
                {val} bonne{val > 1 ? 's' : ''} réponse{val > 1 ? 's' : ''}
              </label>
            ))}
          </div>
        </div>

        {/* Options */}
        <div className="AdminCard TablesSettings__card">
          <p className="TablesSettings__cardTitle">Options</p>
          <div className="TablesSettings__toggles">
            <label className="TablesSettings__toggleRow">
              <input
                type="checkbox"
                checked={hintsEnabled}
                onChange={(e) => updateSetting({ key: 'tables_hints_enabled', value: String(e.target.checked) })}
              />
              <span>Afficher les indices (astuce ×9, ×5…)</span>
            </label>
            <label className="TablesSettings__toggleRow">
              <input
                type="checkbox"
                checked={includeTrivial}
                onChange={(e) => updateSetting({ key: 'tables_include_trivial', value: String(e.target.checked) })}
              />
              <span>Inclure ×0 et ×1 dans les sessions</span>
            </label>
          </div>
        </div>

        {/* Tables connues */}
        <div className="AdminCard TablesSettings__card TablesSettings__card--wide">
          <p className="TablesSettings__cardTitle">Tables déjà connues par Maëve</p>
          <p className="TablesSettings__cardHint">
            Ces tables apparaissent en vert dans l'écran de sélection.
          </p>
          <div className="TablesSettings__knownGrid">
            {ALL_TABLES.map((t) => (
              <button
                key={t}
                className={`TablesSettings__knownBtn${knownTables.includes(t) ? ' TablesSettings__knownBtn--active' : ''}`}
                onClick={() => toggleKnown(t)}
                type="button"
              >
                ×{t}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
