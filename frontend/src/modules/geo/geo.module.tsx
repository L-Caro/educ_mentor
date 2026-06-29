import store from 'src/store';
import { geoApi } from './geo.api.ts';
import { sharedApi } from 'src/store/api/sharedApi.ts';
import type { ModuleManifest } from 'src/types/modules.types.ts';
import type { SetupChoice } from 'src/types/game.types.ts';
import { buildProgressionEntry } from 'src/store/api/progressionEndpoints';

const ALL_TYPE_CHOICES: SetupChoice[] = [
  { value: 'country_to_capital',         icon: '🏛️', label: 'Capitale du pays' },
  { value: 'capital_to_country',         icon: '🔄', label: 'Pays de la capitale' },
  { value: 'country_to_continent',       icon: '🗺️', label: 'Continent du pays' },
  { value: 'country_to_ocean',           icon: '🌊', label: 'Océan du pays' },
  { value: 'flag_to_country',            icon: '🚩', label: 'Pays du drapeau' },
  { value: 'country_to_flag',            icon: '🏳️', label: 'Drapeau du pays' },
  { value: 'odd_one_out',                icon: '🔍', label: 'Intrus géographique' },
  { value: 'country_to_language',        icon: '💬', label: 'Langue du pays' },
  { value: 'select_oceans',              icon: '🌊', label: 'Les vrais océans' },
  { value: 'select_continent_countries', icon: '🗂️', label: "Pays d'un continent" },
  { value: 'country_borders',            icon: '🤝', label: 'Pays frontaliers' },
  { value: 'select_language_countries',  icon: '🗣️', label: "Pays d'une langue" },
  { value: 'identify_country',           icon: '🗺️', label: 'Situer un pays' },
  { value: 'identify_continent',         icon: '🌍', label: 'Situer un continent' },
];

async function loadEnabledTypes(): Promise<SetupChoice[]> {
  const settings = await store.dispatch(sharedApi.endpoints.getSettings.initiate()).unwrap();
  const filterRaw = (settings as Record<string, string>).geo_question_types_filter ?? '';
  if (!filterRaw) return ALL_TYPE_CHOICES;
  const enabled = new Set(filterRaw.split(',').map((t) => t.trim()).filter(Boolean));
  return ALL_TYPE_CHOICES.filter((c) => enabled.has(c.value));
}

export const geoModule: ModuleManifest = {
  id: 'geo',
  setupOptions: [
    { key: 'questionTypes', type: 'multi', label: 'Types de questions', loader: loadEnabledTypes },
  ],
  loadGameSpec: () => import('./geo.game.tsx').then((m) => m.geoGameSpec),
  adminTabs: [{ to: '/admin/geo', label: 'Paramètres', end: true }],
  adminRoutes: [
    { index: true, lazy: () => import('./GeoSettings.tsx').then((m) => ({ Component: m.default })) },
  ],
  progression: buildProgressionEntry({
    getEndpoint: geoApi.endpoints.getGeoProgression,
    resetEndpoint: geoApi.endpoints.resetGeoProgression,
  }),
};
