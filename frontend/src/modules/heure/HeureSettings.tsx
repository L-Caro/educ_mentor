import { useGetSettingsQuery, useUpdateSettingMutation } from 'src/store/api/sharedApi.ts';
import Spinner from 'src/components/common/Spinner.tsx';

const SEPARATOR_OPTIONS = [
  { value: 'h', label: '8h15' },
  { value: ':', label: '8:15' },
];

export default function HeureSettings() {
  const { data: settings = {}, isLoading: loading } = useGetSettingsQuery();
  const [updateSetting, { isLoading: saving }] = useUpdateSettingMutation();

  if (loading) return <Spinner size="sm" />;

  const separator = settings.heure_separator ?? 'h';

  return (
    <div className="GameSettings">
      <div className="GameSettings__header">
        <p className="GameSettings__hint">Ces paramètres s'appliquent à toutes les sessions de jeu.</p>
        {saving && <Spinner size="xs" />}
      </div>

      <div className="GameSettings__grid">
        <div className="AdminCard GameSettings__card">
          <p className="GameSettings__cardTitle">Format de l'heure</p>
          <div className="GameSettings__presets">
            {SEPARATOR_OPTIONS.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                className={`GameSettings__preset${separator === value ? ' GameSettings__preset--active' : ''}`}
                onClick={() => updateSetting({ key: 'heure_separator', value })}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
