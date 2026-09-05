import { useGetSettingsQuery, useUpdateSettingMutation } from 'src/store/api/sharedApi.ts';
import {
  useGetConjugaisonActiveTempsQuery,
  useGetConjugaisonTempsCatalogueQuery,
  useGetConjugaisonVerbsQuery,
  useUpdateConjugaisonActiveTempsMutation,
} from './conjugaison.api.ts';
import Spinner from 'src/components/common/Spinner.tsx';
import './conjugaison.scss';

const GROUP_ORDER = ['auxiliaire', '1', '2', '3'] as const;
const GROUP_LABELS: Record<string, string> = {
  auxiliaire: 'Auxiliaires',
  '1': '1er groupe',
  '2': '2ème groupe',
  '3': '3ème groupe',
};

/** Les temps ouverts. Le catalogue contient les sept temps du CP au CM2 ; seuls les trois
 * temps simples sont actifs à l'installation, les autres attendent d'avoir été vus en
 * classe. La classe est affichée à côté de chacun, pour savoir quand l'ouvrir. */
function TempsActifs() {
  const { data: catalogue = [], isLoading: loadingCatalogue } =
    useGetConjugaisonTempsCatalogueQuery();
  const { data: actifs = [], isLoading: loadingActifs } =
    useGetConjugaisonActiveTempsQuery();
  const [updateActifs, { isLoading: saving }] =
    useUpdateConjugaisonActiveTempsMutation();

  if (loadingCatalogue || loadingActifs) return <Spinner size="sm" />;

  function toggle(key: string) {
    const next = actifs.includes(key)
      ? actifs.filter((k) => k !== key)
      : [...actifs, key];
    if (next.length === 0) return; // toujours au moins un temps jouable
    updateActifs(next);
  }

  return (
    <div className="AdminCard GameSettings__card">
      <div className="GameSettings__header">
        <p className="GameSettings__cardTitle">Temps travaillés</p>
        {saving && <Spinner size="xs" />}
      </div>
      <p className="GameSettings__hint">
        Les sept temps du CP au CM2 sont là. Ouvre-les au fil du programme — la classe
        indiquée dit quand, mais rien n&rsquo;empêche d&rsquo;ouvrir plus tôt.
      </p>
      <div className="GameSettings__denominations">
        {catalogue.map((temps) => (
          <button
            key={temps.key}
            type="button"
            className={`GameSettings__denomination${
              actifs.includes(temps.key)
                ? ' GameSettings__denomination--active'
                : ''
            }`}
            onClick={() => toggle(temps.key)}
            title={temps.exemple}
          >
            {temps.label}
            <span className="GameSettings__niveau">
              {temps.niveau.toUpperCase()}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function ConjugaisonSettings() {
  const { data: verbs = [], isLoading: loadingVerbs } = useGetConjugaisonVerbsQuery();
  const { data: settings = {}, isLoading: loadingSettings } = useGetSettingsQuery();
  const [updateSetting, { isLoading: saving }] = useUpdateSettingMutation();

  if (loadingVerbs || loadingSettings) return <Spinner size="sm" />;

  const filterRaw = settings.conjugaison_verbs_filter ?? '';
  const allInfinitifs = verbs.map((v) => v.infinitif);
  const activeSet = filterRaw
    ? new Set(filterRaw.split(',').map((v) => v.trim()).filter(Boolean))
    : new Set(allInfinitifs);

  function saveFilter(next: Set<string>) {
    const value = next.size === allInfinitifs.length ? '' : [...next].join(',');
    updateSetting({ key: 'conjugaison_verbs_filter', value });
  }

  function toggleVerb(inf: string) {
    const next = new Set(activeSet);
    if (next.has(inf)) {
      next.delete(inf);
    } else {
      next.add(inf);
    }
    saveFilter(next);
  }

  function selectGroup(groupe: string) {
    const next = new Set(activeSet);
    verbs.filter((v) => v.groupe === groupe).forEach((v) => next.add(v.infinitif));
    saveFilter(next);
  }

  function deselectGroup(groupe: string) {
    const next = new Set(activeSet);
    verbs.filter((v) => v.groupe === groupe).forEach((v) => next.delete(v.infinitif));
    saveFilter(next);
  }

  return (
    <div className="GameSettings">
      <TempsActifs />

      <div className="GameSettings__header">
        <p className="GameSettings__hint">
          Choisissez les verbes inclus dans les sessions. Tous les verbes sont actifs par défaut.
        </p>
        {saving && <Spinner size="xs" />}
      </div>

      <div className="GameSettings__grid">
        {GROUP_ORDER.map((groupe) => {
          const groupVerbs = verbs.filter((v) => v.groupe === groupe);
          if (groupVerbs.length === 0) return null;
          return (
            <div key={groupe} className="AdminCard GameSettings__card">
              <p className="GameSettings__cardTitle">{GROUP_LABELS[groupe]}</p>

              <div className="GroupActions">
                <button type="button" onClick={() => selectGroup(groupe)}>Tous</button>
                <button type="button" onClick={() => deselectGroup(groupe)}>Aucun</button>
              </div>

              <div className="ConjugaisonVerbGrid">
                {groupVerbs.map(({ infinitif }) => {
                  const active = activeSet.has(infinitif);
                  return (
                    <button
                      key={infinitif}
                      type="button"
                      className={`ConjugaisonVerbChip${active ? ' ConjugaisonVerbChip--active' : ' ConjugaisonVerbChip--inactive'}`}
                      onClick={() => toggleVerb(infinitif)}
                    >
                      {infinitif}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
