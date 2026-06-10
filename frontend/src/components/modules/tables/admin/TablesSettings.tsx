import { useGetSettingsQuery, useUpdateSettingMutation } from 'src/store/api/api';
import Spinner from 'src/components/common/Spinner';

export default function TablesSettings() {
  const { data: settings = {}, isLoading: loading } = useGetSettingsQuery();
  const [updateSetting, { isLoading: saving }] = useUpdateSettingMutation();

  if (loading) return <Spinner size="sm" />;

  const choiceCount    = settings.tables_choice_count ?? '4';
  const includeTrivial = settings.tables_include_trivial !== 'false';

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

        {/* Options */}
        <div className="AdminCard TablesSettings__card">
          <p className="TablesSettings__cardTitle">Options</p>
          <div className="TablesSettings__toggles">
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
      </div>
    </div>
  );
}
