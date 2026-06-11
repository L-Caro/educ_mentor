import { useGetSettingsQuery, useUpdateSettingMutation } from 'src/store/api/sharedApi';
import Spinner from 'src/components/common/Spinner';

const MAX_AMOUNT_PRESETS = [5, 10, 20, 50, 100, 500];

const PIECE_DENOMINATIONS = [
  { value: 1, label: '1c' },
  { value: 2, label: '2c' },
  { value: 5, label: '5c' },
  { value: 10, label: '10c' },
  { value: 20, label: '20c' },
  { value: 50, label: '50c' },
  { value: 100, label: '1€' },
  { value: 200, label: '2€' },
];

const BILLET_DENOMINATIONS = [
  { value: 500, label: '5€' },
  { value: 1000, label: '10€' },
  { value: 2000, label: '20€' },
  { value: 5000, label: '50€' },
];

export default function MonnaieSettings() {
  const { data: settings = {}, isLoading: loading } = useGetSettingsQuery();
  const [updateSetting, { isLoading: saving }] = useUpdateSettingMutation();

  function toggleDenomination(denominationValue: number, enabled: boolean) {
    const current = (settings.monnaie_denominations ?? '1,2,5,10,20,50,100,200,500,1000,2000,5000')
      .split(',').map((rawValue) => parseInt(rawValue.trim(), 10)).filter(Boolean);
    let updated: number[];
    if (enabled) {
      updated = [...new Set([...current, denominationValue])].sort((a, b) => a - b);
    } else {
      updated = current.filter((activeValue) => activeValue !== denominationValue);
      if (updated.length === 0) return;
    }
    updateSetting({ key: 'monnaie_denominations', value: updated.join(',') });
  }

  if (loading) return <Spinner size="sm" />;

  const activeDenominations = (settings.monnaie_denominations ?? '1,2,5,10,20,50,100,200,500,1000,2000,5000')
    .split(',').map((rawValue) => parseInt(rawValue.trim(), 10));
  const maxAmount = parseInt(settings.monnaie_max_amount ?? '10', 10);
  const wholeEuros = settings.monnaie_whole_euros === 'true';
  const itemsCount = parseInt(settings.monnaie_items_count ?? '3', 10);

  return (
    <div className="MonnaieSettings">
      <div className="MonnaieSettings__header">
        <p className="MonnaieSettings__hint">Ces paramètres s'appliquent à toutes les sessions de jeu.</p>
        {saving && <Spinner size="xs" />}
      </div>

      <div className="MonnaieSettings__grid">
        {/* Pièces */}
        <div className="AdminCard MonnaieSettings__card">
          <p className="MonnaieSettings__cardTitle">Pièces</p>
          <div className="MonnaieSettings__denominations">
            {PIECE_DENOMINATIONS.map(({ value, label }) => (
              <label key={value} className="MonnaieSettings__denomination">
                <input
                  type="checkbox"
                  checked={activeDenominations.includes(value)}
                  onChange={(event) => toggleDenomination(value, event.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
        </div>

        {/* Billets */}
        <div className="AdminCard MonnaieSettings__card">
          <p className="MonnaieSettings__cardTitle">Billets</p>
          <div className="MonnaieSettings__denominations">
            {BILLET_DENOMINATIONS.map(({ value, label }) => (
              <label key={value} className="MonnaieSettings__denomination">
                <input
                  type="checkbox"
                  checked={activeDenominations.includes(value)}
                  onChange={(event) => toggleDenomination(value, event.target.checked)}
                />
                {label}
              </label>
            ))}
          </div>
          <label className="MonnaieSettings__toggle">
            <input
              type="checkbox"
              checked={wholeEuros}
              onChange={(event) => updateSetting({ key: 'monnaie_whole_euros', value: String(event.target.checked) })}
            />
            Euros entiers uniquement
          </label>
        </div>

        {/* Plage max */}
        <div className="AdminCard MonnaieSettings__card">
          <p className="MonnaieSettings__cardTitle">Montant maximum</p>
          <div className="MonnaieSettings__presets">
            {MAX_AMOUNT_PRESETS.map((preset) => (
              <button
                key={preset}
                type="button"
                className={`MonnaieSettings__preset${maxAmount === preset ? ' MonnaieSettings__preset--active' : ''}`}
                onClick={() => updateSetting({ key: 'monnaie_max_amount', value: String(preset) })}
              >
                {preset}€
              </button>
            ))}
          </div>
        </div>

        {/* Nombre d'articles */}
        <div className="AdminCard MonnaieSettings__card">
          <p className="MonnaieSettings__cardTitle">Articles par exercice (total d'achat)</p>
          <div className="MonnaieSettings__rangeRow">
            <input
              type="range"
              min={1} max={10} step={1}
              value={itemsCount}
              onChange={(event) => updateSetting({ key: 'monnaie_items_count', value: event.target.value })}
              className="MonnaieSettings__range"
            />
            <span className="MonnaieSettings__rangeValue">{itemsCount}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
