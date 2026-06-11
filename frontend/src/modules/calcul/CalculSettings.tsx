import { useGetSettingsQuery, useUpdateSettingMutation } from 'src/store/api/sharedApi.ts';
import Spinner from 'src/components/common/Spinner.tsx';

export default function CalculSettings() {
  const { data: settings = {}, isLoading: loading } = useGetSettingsQuery();
  const [updateSetting, { isLoading: saving }] = useUpdateSettingMutation();

  if (loading) return <Spinner size="sm" />;

  const minValue = parseInt(settings.calcul_min_value ?? '0', 10);
  const maxValue = parseInt(settings.calcul_max_value ?? '20', 10);

  function handleMinChange(v: number) {
    const safeMin = Math.min(v, maxValue - 1);
    updateSetting({ key: 'calcul_min_value', value: String(safeMin) });
  }

  function handleMaxChange(v: number) {
    const safeMax = Math.max(v, minValue + 1);
    updateSetting({ key: 'calcul_max_value', value: String(safeMax) });
  }

  return (
    <div className="GameSettings">
      <div className="GameSettings__header">
        <p className="GameSettings__hint">Ces paramètres s'appliquent à la session de jeu.</p>
        {saving && <Spinner size="xs" />}
      </div>

      <div className="GameSettings__grid">
        {/* Plage de nombres */}
        <div className="AdminCard GameSettings__card">
          <p className="GameSettings__cardTitle">Plage de nombres</p>

          <div className="GameSettings__denominations">
            {([['0', '20'], ['0', '50'], ['0', '100']] as const).map(([min, max]) => (
              <button
                key={max}
                type="button"
                className={`GameSettings__denomination${minValue === parseInt(min) && maxValue === parseInt(max) ? ' GameSettings__denomination--active' : ''}`}
                onClick={() => {
                  updateSetting({ key: 'calcul_min_value', value: min });
                  updateSetting({ key: 'calcul_max_value', value: max });
                }}
              >
                → {max}
              </button>
            ))}
          </div>

          <div className="GameSettings__rangeRow">
            <label className="GameSettings__rangeLabel">De</label>
            <input
              type="range"
              min={0} max={90} step={1}
              value={minValue}
              onChange={(e) => handleMinChange(parseInt(e.target.value, 10))}
              className="GameSettings__range"
            />
            <span className="GameSettings__rangeValue">{minValue}</span>
          </div>

          <div className="GameSettings__rangeRow">
            <label className="GameSettings__rangeLabel">Jusqu'à</label>
            <input
              type="range"
              min={10} max={100} step={1}
              value={maxValue}
              onChange={(e) => handleMaxChange(parseInt(e.target.value, 10))}
              className="GameSettings__range"
            />
            <span className="GameSettings__rangeValue">{maxValue}</span>
          </div>
        </div>
      </div>
    </div>
  );
}