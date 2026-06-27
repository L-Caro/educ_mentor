import { useGetSettingsQuery, useUpdateSettingMutation } from 'src/store/api/sharedApi.ts';
import { useGetConjugaisonVerbsQuery } from './conjugaison.api.ts';
import Spinner from 'src/components/common/Spinner.tsx';
import './conjugaison.scss';

const GROUP_ORDER = ['auxiliaire', '1', '2', '3'] as const;
const GROUP_LABELS: Record<string, string> = {
  auxiliaire: 'Auxiliaires',
  '1': '1er groupe',
  '2': '2ème groupe',
  '3': '3ème groupe',
};

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

              <div className="ConjugaisonGroupActions">
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
