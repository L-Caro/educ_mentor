import { useGetSettingsQuery, useUpdateSettingMutation } from 'src/store/api/sharedApi.ts';
import { useGetFranceRegionsQuery } from './france.api.ts';
import Spinner from 'src/components/common/Spinner.tsx';
import '../geo/geo.scss';

const QUESTION_TYPES = [
  { value: 'dept_to_number',       icon: '🔢', label: 'Département → numéro',          description: 'Quel est le numéro de la Gironde ?' },
  { value: 'number_to_dept',       icon: '🏷️', label: 'Numéro → département',          description: 'Quel est le nom du département 33 ?' },
  { value: 'dept_to_prefecture',   icon: '🏛️', label: 'Préfecture du département',     description: 'Quelle est la préfecture de la Gironde ?' },
  { value: 'prefecture_to_dept',   icon: '🔄', label: 'Département de la préfecture',  description: 'Bordeaux est la préfecture de quel département ?' },
  { value: 'dept_to_region',       icon: '🗺️', label: 'Région du département',         description: 'Dans quelle région est la Gironde ?' },
  { value: 'region_chef_lieu',     icon: '🏙️', label: 'Chef-lieu de la région',        description: 'Quel est le chef-lieu de la Nouvelle-Aquitaine ?' },
  { value: 'dept_borders',         icon: '🤝', label: 'Départements voisins',           description: 'Choix multiples : voisins de la Gironde' },
  { value: 'dept_sub_prefectures', icon: '📍', label: 'Sous-préfectures',              description: "Choix multiples : sous-préfectures de l'Ain" },
  { value: 'region_depts',         icon: '🗂️', label: 'Départements de la région',     description: 'Choix multiples : départements de Bretagne' },
  { value: 'region_old_names',     icon: '📜', label: 'Anciennes régions',             description: 'Choix multiples : anciennes régions de la Nouvelle-Aquitaine' },
  { value: 'river_depts',          icon: '🌊', label: 'Départements du fleuve',        description: 'Choix multiples : départements traversés par la Loire' },
  { value: 'maritime_facade',      icon: '⚓', label: 'Façade maritime',              description: 'Sur quelle mer donne la Gironde ?' },
  { value: 'massif_summit',        icon: '⛰️', label: 'Sommet du massif',             description: 'Quel est le point culminant des Alpes ?' },
  { value: 'summit_altitude',      icon: '📏', label: 'Altitude du sommet',           description: 'À quelle altitude culmine le Mont Blanc ?' },
  { value: 'dept_gentile',         icon: '👤', label: 'Gentilé du département',       description: 'Comment appelle-t-on un habitant de la Gironde ?' },
  { value: 'identify_dept',        icon: '🖱️', label: 'Localiser un département',     description: 'Cliquer sur la Gironde sur la carte' },
  { value: 'identify_region',      icon: '🗾', label: 'Région sur la carte',          description: 'Cliquer sur un département de Bretagne' },
] as const;

const ALL_TYPE_VALUES = QUESTION_TYPES.map((t) => t.value);

export default function FranceSettings() {
  const { data: regions = [], isLoading: loadingRegions } = useGetFranceRegionsQuery();
  const { data: rawSettings = {}, isLoading: loadingSettings } = useGetSettingsQuery();
  const [updateSetting, { isLoading: saving }] = useUpdateSettingMutation();

  if (loadingRegions || loadingSettings) return <Spinner size="sm" />;

  const settings = rawSettings as Record<string, string>;

  // ── Types de questions ───────────────────────────────────────────────────

  const typesFilterRaw = settings.france_question_types_filter ?? '';
  const activeTypes = typesFilterRaw
    ? new Set(typesFilterRaw.split(',').map((t) => t.trim()).filter(Boolean))
    : new Set(ALL_TYPE_VALUES);

  function saveTypes(next: Set<string>) {
    const value = next.size === ALL_TYPE_VALUES.length ? '' : [...next].join(',');
    updateSetting({ key: 'france_question_types_filter', value });
  }

  function toggleType(value: string) {
    const next = new Set(activeTypes);
    next.has(value) ? next.delete(value) : next.add(value);
    saveTypes(next);
  }

  // ── Régions ──────────────────────────────────────────────────────────────

  const regionsFilterRaw = settings.france_regions_filter ?? '';
  const allRegionCodes = regions.map((r) => r.code);
  const activeRegions = regionsFilterRaw
    ? new Set(regionsFilterRaw.split(',').map((c) => c.trim()).filter(Boolean))
    : new Set(allRegionCodes);

  function saveRegions(next: Set<string>) {
    const value = next.size === allRegionCodes.length ? '' : [...next].join(',');
    updateSetting({ key: 'france_regions_filter', value });
  }

  function toggleRegion(code: string) {
    const next = new Set(activeRegions);
    next.has(code) ? next.delete(code) : next.add(code);
    saveRegions(next);
  }

  return (
    <div className="GameSettings">
      <div className="GameSettings__header">
        {saving && <Spinner />}
      </div>

      {/* ── Types de questions ─────────────────────────────────────────── */}
      <div className="AdminCard GameSettings__card GameSettings__card--full">
        <p className="GameSettings__cardTitle">Types de questions actifs</p>
        <p className="GameSettings__hint" style={{ marginBottom: '1rem' }}>
          Active les types au fur et à mesure — seuls les types cochés apparaissent dans les sessions.
        </p>

        <div className="GroupActions">
          <button type="button" onClick={() => saveTypes(new Set(ALL_TYPE_VALUES))}>Tous</button>
          <button type="button" onClick={() => saveTypes(new Set())}>Aucun</button>
        </div>

        <div className="GeoTypeGrid">
          {QUESTION_TYPES.map(({ value, icon, label, description }) => {
            const active = activeTypes.has(value);
            return (
              <button
                key={value}
                type="button"
                className={`GeoTypeChip${active ? ' GeoTypeChip--active' : ' GeoTypeChip--inactive'}`}
                onClick={() => toggleType(value)}
              >
                <span className="GeoTypeChip__icon">{icon}</span>
                <span className="GeoTypeChip__label">{label}</span>
                <span className="GeoTypeChip__desc">{description}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Régions ───────────────────────────────────────────────────── */}
      <div className="AdminCard GameSettings__card GameSettings__card--full">
        <p className="GameSettings__cardTitle">Régions actives</p>
        <p className="GameSettings__hint" style={{ marginBottom: '1rem' }}>
          Limite les questions à certaines régions. Par défaut, toutes sont actives.
        </p>

        <div className="GroupActions">
          <button type="button" onClick={() => saveRegions(new Set(allRegionCodes))}>Toutes</button>
          <button type="button" onClick={() => saveRegions(new Set())}>Aucune</button>
        </div>

        <div className="GeoCountryGrid">
          {regions.map(({ code, nom, dept_count }) => {
            const active = activeRegions.has(code);
            return (
              <button
                key={code}
                type="button"
                className={`GeoCountryChip${active ? ' GeoCountryChip--active' : ' GeoCountryChip--inactive'}`}
                onClick={() => toggleRegion(code)}
              >
                <span className="GeoCountryChip__name">{nom}</span>
                <span style={{ opacity: 0.5, fontSize: '0.8em' }}>{dept_count} dép.</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
