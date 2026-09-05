import { useGetSettingsQuery, useUpdateSettingMutation } from 'src/store/api/sharedApi';
import Spinner from 'src/components/common/Spinner';
import type { PositionKey } from '../numeration.type';
import { useGetNumerationPositionsQuery } from '../numeration.api';

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
  const { data: POSITIONS = [], isLoading: loadingPositions } =
    useGetNumerationPositionsQuery();
  const [updateSetting, { isLoading: saving }] = useUpdateSettingMutation();

  if (isLoading || loadingPositions) return <Spinner size="sm" />;

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
            Détermine la plage de nombres pour tous les types de questions. Les
            positions vont des millièmes aux centaines de millions ; la classe
            indiquée dit quand les ouvrir. Ouvrir une décimale fait apparaître la
            virgule partout — comparaisons, décompositions et valeur positionnelle.
          </p>
          <div className="GameSettings__denominations">
            {POSITIONS.map(({ key, label, niveau }) => (
              <button
                key={key}
                type="button"
                className={`GameSettings__denomination${activePositions.includes(key as PositionKey) ? ' GameSettings__denomination--active' : ''}`}
                onClick={() => togglePosition(key as PositionKey)}
              >
                {label}
                <span className="NumerationSettings__niveau">
                  {niveau.toUpperCase()}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="AdminCard GameSettings__card">
          <p className="GameSettings__cardTitle">Pas des suites numériques</p>
          <p className="GameSettings__hint" style={{ marginBottom: '1rem' }}>
            Le moteur pioche un pas aléatoire parmi ceux activés. Le pas s&rsquo;entend
            en unités affichées : « de 2 en 2 » compte 2, pas deux centièmes.
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