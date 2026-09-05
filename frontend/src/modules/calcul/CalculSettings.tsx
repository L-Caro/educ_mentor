import { useGetSettingsQuery, useUpdateSettingMutation } from 'src/store/api/sharedApi.ts';
import Spinner from 'src/components/common/Spinner.tsx';
import {
  useGetCalculActiveTypesQuery,
  useGetCalculOperationsQuery,
  useUpdateCalculActiveTypesMutation,
} from './calcul.api.ts';

/** Les types de calcul ouverts. Le catalogue va du CP au CM2 ; seul l'additif est actif à
 * l'installation, le multiplicatif attend d'avoir été vu en classe.
 *
 * La plage de nombres ci-dessous ne borne QUE l'additif : une multiplication bornée à 20
 * ne sortirait jamais la table de 7. Les types multiplicatifs portent leurs propres
 * bornes, tirées des tables. */
function TypesActifs() {
  const { data: operations = [], isLoading: loadingOps } =
    useGetCalculOperationsQuery();
  const { data: actifs = [], isLoading: loadingActifs } =
    useGetCalculActiveTypesQuery();
  const [updateActifs, { isLoading: saving }] =
    useUpdateCalculActiveTypesMutation();

  if (loadingOps || loadingActifs) return <Spinner size="sm" />;

  function toggle(key: string) {
    const next = actifs.includes(key)
      ? actifs.filter((k) => k !== key)
      : [...actifs, key];
    if (next.length === 0) return; // toujours au moins un type jouable
    updateActifs(next);
  }

  return (
    <div className="AdminCard GameSettings__card">
      <div className="GameSettings__header">
        <p className="GameSettings__cardTitle">Types de calcul</p>
        {saving && <Spinner size="xs" />}
      </div>
      <p className="GameSettings__hint">
        Du CP au CM2. La classe indiquée dit quand ouvrir : rien n&rsquo;empêche
        d&rsquo;ouvrir plus tôt. La plage de nombres ci-dessous ne borne que
        l&rsquo;additif : les multiplications et divisions tirent leurs bornes des
        tables.
      </p>
      <div className="GameSettings__denominations">
        {operations.map((operation) => (
          <button
            key={operation.key}
            type="button"
            className={`GameSettings__denomination${
              actifs.includes(operation.key)
                ? ' GameSettings__denomination--active'
                : ''
            }`}
            onClick={() => toggle(operation.key)}
            title={operation.exemple}
          >
            {operation.label}
            <span className="GameSettings__niveau">
              {operation.niveau.toUpperCase()}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

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
      <TypesActifs />

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