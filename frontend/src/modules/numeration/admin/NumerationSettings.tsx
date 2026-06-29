import { useGetSettingsQuery, useUpdateSettingMutation } from 'src/store/api/sharedApi';
import Spinner from 'src/components/common/Spinner';

type PositionKey = 'u' | 'd' | 'c' | 'm' | 'dm' | 'cm';

const POSITIONS: { key: PositionKey; label: string }[] = [
  { key: 'u',  label: 'Unités (1–9)' },
  { key: 'd',  label: 'Dizaines (10–99)' },
  { key: 'c',  label: 'Centaines (100–999)' },
  { key: 'm',  label: 'Milliers (1 000–9 999)' },
  { key: 'dm', label: 'Diz. de milliers (10 000–99 999)' },
  { key: 'cm', label: 'Cent. de milliers (100 000–999 999)' },
];

const ALL_STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 15, 20, 50, 100, 200, 500, 1000];

function parsePositions(raw: string | undefined): PositionKey[] {
  try { return JSON.parse(raw ?? '["u","d"]') as PositionKey[]; }
  catch { return ['u', 'd']; }
}

function parseSteps(raw: string | undefined): number[] {
  try { return JSON.parse(raw ?? '[1,2,5,10]') as number[]; }
  catch { return [1, 2, 5, 10]; }
}

export default function NumerationSettings() {
  const { data: settings = {}, isLoading } = useGetSettingsQuery();
  const [updateSetting, { isLoading: saving }] = useUpdateSettingMutation();

  if (isLoading) return <Spinner size="sm" />;

  const activePositions = parsePositions(settings.numeration_active_positions);
  const activeSteps     = parseSteps(settings.numeration_active_steps);

  function togglePosition(key: PositionKey) {
    const next = activePositions.includes(key)
      ? activePositions.filter((p) => p !== key)
      : [...activePositions, key];
    if (next.length === 0) return;
    updateSetting({ key: 'numeration_active_positions', value: JSON.stringify(next) });
  }

  function toggleStep(step: number) {
    const next = activeSteps.includes(step)
      ? activeSteps.filter((s) => s !== step)
      : [...activeSteps, step];
    if (next.length === 0) return;
    updateSetting({ key: 'numeration_active_steps', value: JSON.stringify(next) });
  }

  return (
    <div className="GameSettings">
      <div className="GameSettings__header">
        <p className="GameSettings__hint">
          Ces paramètres s'appliquent à toutes les sessions de numération.
        </p>
        {saving && <Spinner size="xs" />}
      </div>

      <div className="GameSettings__grid">

        <div className="AdminCard GameSettings__card">
          <p className="GameSettings__cardTitle">Positions actives</p>
          <p className="GameSettings__hint" style={{ marginBottom: '1rem' }}>
            Détermine la plage de nombres pour tous les types de questions.
          </p>
          <div className="GameSettings__denominations">
            {POSITIONS.map(({ key, label }) => (
              <button
                key={key}
                type="button"
                className={`GameSettings__denomination${activePositions.includes(key) ? ' GameSettings__denomination--active' : ''}`}
                onClick={() => togglePosition(key)}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="AdminCard GameSettings__card">
          <p className="GameSettings__cardTitle">Pas des suites numériques</p>
          <p className="GameSettings__hint" style={{ marginBottom: '1rem' }}>
            Le moteur pioche un pas aléatoire parmi ceux activés.
          </p>
          <div className="GameSettings__denominations">
            {ALL_STEPS.map((step) => (
              <button
                key={step}
                type="button"
                className={`GameSettings__denomination${activeSteps.includes(step) ? ' GameSettings__denomination--active' : ''}`}
                onClick={() => toggleStep(step)}
              >
                {step}
              </button>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}