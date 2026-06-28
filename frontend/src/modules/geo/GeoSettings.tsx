import { useGetSettingsQuery, useUpdateSettingMutation } from 'src/store/api/sharedApi.ts';
import { useGetGeoCountriesQuery } from './geo.api.ts';
import Spinner from 'src/components/common/Spinner.tsx';
import './geo.scss';

const CONTINENT_ORDER = ['Europe', 'Asie', 'Afrique', 'Amérique du Nord', 'Amérique du Sud', 'Océanie'];

const QUESTION_TYPES = [
  { value: 'country_to_capital',         icon: '🏛️', label: 'Capitale du pays',        description: 'Quel est la capitale de France ?' },
  { value: 'capital_to_country',         icon: '🔄', label: 'Pays de la capitale',      description: 'Paris est la capitale de ?' },
  { value: 'country_to_continent',       icon: '🗺️', label: 'Continent du pays',        description: 'Dans quel continent est le Japon ?' },
  { value: 'country_to_ocean',           icon: '🌊', label: 'Océan du pays',            description: 'Quel océan borde le Brésil ?' },
  { value: 'flag_to_country',            icon: '🚩', label: 'Pays du drapeau',          description: 'Quel pays représente ce drapeau ?' },
  { value: 'country_to_flag',            icon: '🏳️', label: 'Drapeau du pays',          description: 'Quel est le drapeau de l\'Italie ?' },
  { value: 'odd_one_out',                icon: '🔍', label: 'Intrus géographique',      description: 'Quel pays n\'est pas en Europe ?' },
  { value: 'country_to_language',        icon: '💬', label: 'Langue du pays',           description: 'Quelle langue parle-t-on en Australie ?' },
  { value: 'select_oceans',              icon: '🌊', label: 'Les vrais océans',          description: 'Choix multiples : identifier les océans' },
  { value: 'select_continent_countries', icon: '🗂️', label: 'Pays d\'un continent',     description: 'Choix multiples : tous les pays d\'Europe' },
  { value: 'country_borders',            icon: '🤝', label: 'Pays frontaliers',          description: 'Choix multiples : voisins de la France' },
  { value: 'select_language_countries',  icon: '🗣️', label: 'Pays d\'une langue',       description: 'Choix multiples : pays parlant espagnol' },
  { value: 'identify_country',           icon: '🗺️', label: 'Situer un pays',            description: 'Cliquer sur le pays sur la carte du monde' },
] as const;

const ALL_TYPE_VALUES = QUESTION_TYPES.map((t) => t.value);

export default function GeoSettings() {
  const { data: countries = [], isLoading: loadingCountries } = useGetGeoCountriesQuery();
  const { data: rawSettings = {}, isLoading: loadingSettings } = useGetSettingsQuery();
  const [updateSetting, { isLoading: saving }] = useUpdateSettingMutation();

  if (loadingCountries || loadingSettings) return <Spinner size="sm" />;

  const settings = rawSettings as Record<string, string>;

  // ── Types de questions ───────────────────────────────────────────────────

  const typesFilterRaw = settings.geo_question_types_filter ?? '';
  const activeTypes = typesFilterRaw
    ? new Set(typesFilterRaw.split(',').map((t) => t.trim()).filter(Boolean))
    : new Set(ALL_TYPE_VALUES);

  function saveTypes(next: Set<string>) {
    const value = next.size === ALL_TYPE_VALUES.length ? '' : [...next].join(',');
    updateSetting({ key: 'geo_question_types_filter', value });
  }

  function toggleType(value: string) {
    const next = new Set(activeTypes);
    next.has(value) ? next.delete(value) : next.add(value);
    saveTypes(next);
  }

  // ── Pays ────────────────────────────────────────────────────────────────

  const countriesFilterRaw = settings.geo_countries_filter ?? '';
  const allCodes = countries.map((c) => c.code);
  const activeCountries = countriesFilterRaw
    ? new Set(countriesFilterRaw.split(',').map((c) => c.trim()).filter(Boolean))
    : new Set(allCodes);

  function saveCountries(next: Set<string>) {
    const value = next.size === allCodes.length ? '' : [...next].join(',');
    updateSetting({ key: 'geo_countries_filter', value });
  }

  function toggleCountry(code: string) {
    const next = new Set(activeCountries);
    next.has(code) ? next.delete(code) : next.add(code);
    saveCountries(next);
  }

  function selectContinent(continent: string) {
    const next = new Set(activeCountries);
    countries.filter((c) => c.continent === continent).forEach((c) => next.add(c.code));
    saveCountries(next);
  }

  function deselectContinent(continent: string) {
    const next = new Set(activeCountries);
    countries.filter((c) => c.continent === continent).forEach((c) => next.delete(c.code));
    saveCountries(next);
  }

  const continentsPresent = CONTINENT_ORDER.filter((c) => countries.some((p) => p.continent === c));

  return (
    <div className="GameSettings">
      <div className="GameSettings__header">
        {saving && <Spinner size="xs" />}
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

      {/* ── Pays ──────────────────────────────────────────────────────── */}
      <div className="GameSettings__grid">
        {continentsPresent.map((continent) => {
          const continentCountries = countries.filter((c) => c.continent === continent);
          return (
            <div key={continent} className="AdminCard GameSettings__card">
              <p className="GameSettings__cardTitle">{continent}</p>

              <div className="GroupActions">
                <button type="button" onClick={() => selectContinent(continent)}>Tous</button>
                <button type="button" onClick={() => deselectContinent(continent)}>Aucun</button>
              </div>

              <div className="GeoCountryGrid">
                {continentCountries.map(({ code, nom, drapeau }) => {
                  const active = activeCountries.has(code);
                  return (
                    <button
                      key={code}
                      type="button"
                      className={`GeoCountryChip${active ? ' GeoCountryChip--active' : ' GeoCountryChip--inactive'}`}
                      onClick={() => toggleCountry(code)}
                    >
                      <span className="GeoCountryChip__flag">{drapeau}</span>
                      <span className="GeoCountryChip__name">{nom}</span>
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
