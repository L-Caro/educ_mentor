import { useGetSettingsQuery, useUpdateSettingMutation } from 'src/store/api/api';
import Spinner from 'src/components/common/Spinner';

const OPERATION_TYPES = [
  { key: 'complement', label: 'Compléments', example: '3 + ? = 10' },
  { key: 'addition', label: 'Additions', example: '3 + 4 = ?' },
  { key: 'soustraction', label: 'Soustractions', example: '10 - 3 = ?' },
  { key: 'double', label: 'Doubles', example: 'Double de 6 = ?' },
  { key: 'moitie', label: 'Moitiés', example: 'Moitié de 12 = ?' },
] as const;

export default function CalculSettings() {
  const { data: settings = {}, isLoading: loading } = useGetSettingsQuery();
  const [updateSetting, { isLoading: saving }] = useUpdateSettingMutation();

  if (loading) return <Spinner size="sm" />;

  const minValue = parseInt(settings.calcul_min_value ?? '0', 10);
  const maxValue = parseInt(settings.calcul_max_value ?? '20', 10);
  const activeOperationTypes = (settings.calcul_operation_types ?? 'complement,addition,soustraction')
    .split(',')
    .map((rawType) => rawType.trim());

  function handleMinChange(v: number) {
    const safeMin = Math.min(v, maxValue - 1);
    updateSetting({ key: 'calcul_min_value', value: String(safeMin) });
  }

  function handleMaxChange(v: number) {
    const safeMax = Math.max(v, minValue + 1);
    updateSetting({ key: 'calcul_max_value', value: String(safeMax) });
  }

  function toggleOperationType(key: string, enabled: boolean) {
    const currentTypes = (settings.calcul_operation_types ?? 'complement,addition,soustraction')
      .split(',')
      .map((rawType) => rawType.trim())
      .filter(Boolean);
    let updatedTypes: string[];
    if (enabled) {
      updatedTypes = [...new Set([...currentTypes, key])];
    } else {
      updatedTypes = currentTypes.filter((operationType) => operationType !== key);
      if (updatedTypes.length === 0) return;
    }
    updateSetting({ key: 'calcul_operation_types', value: updatedTypes.join(',') });
  }

  return (
    <div className="CalculSettings">
      <div className="CalculSettings__header">
        <p className="CalculSettings__hint">Ces paramètres s'appliquent à la session de jeu.</p>
        {saving && <Spinner size="xs" />}
      </div>

      <div className="CalculSettings__grid">
        {/* Plage de nombres */}
        <div className="AdminCard CalculSettings__card CalculSettings__card--wide">
          <p className="CalculSettings__cardTitle">Plage de nombres</p>

          <div className="CalculSettings__presets">
            {([['0', '20'], ['0', '50'], ['0', '100']] as const).map(([min, max]) => (
              <button
                key={max}
                type="button"
                className={`CalculSettings__preset${minValue === parseInt(min) && maxValue === parseInt(max) ? ' CalculSettings__preset--active' : ''}`}
                onClick={() => {
                  updateSetting({ key: 'calcul_min_value', value: min });
                  updateSetting({ key: 'calcul_max_value', value: max });
                }}
              >
                → {max}
              </button>
            ))}
          </div>

          <div className="CalculSettings__rangeRow">
            <label className="CalculSettings__rangeLabel">De</label>
            <input
              type="range"
              min={0} max={90} step={1}
              value={minValue}
              onChange={(e) => handleMinChange(parseInt(e.target.value, 10))}
              className="CalculSettings__range"
            />
            <span className="CalculSettings__rangeValue">{minValue}</span>
          </div>

          <div className="CalculSettings__rangeRow">
            <label className="CalculSettings__rangeLabel">Jusqu'à</label>
            <input
              type="range"
              min={10} max={100} step={1}
              value={maxValue}
              onChange={(e) => handleMaxChange(parseInt(e.target.value, 10))}
              className="CalculSettings__range"
            />
            <span className="CalculSettings__rangeValue">{maxValue}</span>
          </div>
        </div>

        {/* Types d'opérations */}
        <div className="AdminCard CalculSettings__card">
          <p className="CalculSettings__cardTitle">Types d'opérations</p>
          <div className="CalculSettings__checks">
            {OPERATION_TYPES.map(({ key, label, example }) => (
              <label key={key} className="CalculSettings__check">
                <input
                  type="checkbox"
                  checked={activeOperationTypes.includes(key)}
                  onChange={(e) => toggleOperationType(key, e.target.checked)}
                />
                <span className="CalculSettings__checkLabel">{label}</span>
                <span className="CalculSettings__checkExample">{example}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}