import { useGetSettingsQuery, useUpdateSettingMutation } from 'src/store/api/sharedApi.ts';
import Spinner from 'src/components/common/Spinner.tsx';

export default function TablesSettings() {
  const { data: settings = {}, isLoading: loading } = useGetSettingsQuery();
  const [updateSetting, { isLoading: saving }] = useUpdateSettingMutation();

  if (loading) return <Spinner size="sm" />;

  const includeTrivial = settings.tables_include_trivial !== 'false';

  return (
    <div className="GameSettings">
      <div className="GameSettings__header">
        <p className="GameSettings__hint">
          Ces paramètres s'appliquent à la session de jeu de Maëve.
        </p>
        {saving && <Spinner size="xs" />}
      </div>

      <div className="GameSettings__grid">
        {/* Options */}
        <div className="AdminCard GameSettings__card">
          <p className="GameSettings__cardTitle">Options</p>
          <div className="GameSettings__toggles">
            <label className="GameSettings__toggleRow">
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
