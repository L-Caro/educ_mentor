import store from 'src/store';
import { franceApi } from './france.api.ts';
import { sharedApi } from 'src/store/api/sharedApi.ts';
import type { ModuleManifest } from 'src/types/modules.types.ts';
import type { SetupChoice } from 'src/types/game.types.ts';
import { buildProgressionEntry } from 'src/store/api/progressionEndpoints';

const ALL_TYPE_CHOICES: SetupChoice[] = [
  { value: 'dept_to_number',       icon: '🔢', label: 'Département → numéro' },
  { value: 'number_to_dept',       icon: '🏷️', label: 'Numéro → département' },
  { value: 'dept_to_prefecture',   icon: '🏛️', label: 'Préfecture du département' },
  { value: 'prefecture_to_dept',   icon: '🔄', label: 'Département de la préfecture' },
  { value: 'dept_to_region',       icon: '🗺️', label: 'Région du département' },
  { value: 'region_chef_lieu',     icon: '🏙️', label: 'Chef-lieu de la région' },
  { value: 'dept_borders',         icon: '🤝', label: 'Départements voisins' },
  { value: 'dept_sub_prefectures', icon: '📍', label: 'Sous-préfectures' },
  { value: 'region_depts',         icon: '🗂️', label: 'Départements de la région' },
  { value: 'region_old_names',     icon: '📜', label: 'Anciennes régions' },
  { value: 'river_depts',          icon: '🌊', label: 'Départements du fleuve' },
  { value: 'maritime_facade',      icon: '⚓', label: 'Façade maritime' },
  { value: 'massif_summit',        icon: '⛰️', label: 'Sommet du massif' },
  { value: 'summit_altitude',      icon: '📏', label: 'Altitude du sommet' },
  { value: 'dept_gentile',         icon: '👤', label: 'Gentilé du département' },
];

async function loadEnabledTypes(): Promise<SetupChoice[]> {
  const settings = await store.dispatch(sharedApi.endpoints.getSettings.initiate()).unwrap();
  const filterRaw = (settings as Record<string, string>).france_question_types_filter ?? '';
  if (!filterRaw) return ALL_TYPE_CHOICES;
  const enabled = new Set(filterRaw.split(',').map((t) => t.trim()).filter(Boolean));
  return ALL_TYPE_CHOICES.filter((c) => enabled.has(c.value));
}

export const franceModule: ModuleManifest = {
  id: 'france',
  setupOptions: [
    { key: 'questionTypes', type: 'multi', label: 'Types de questions', loader: loadEnabledTypes },
  ],
  loadGameSpec: () => import('./france.game.tsx').then((m) => m.franceGameSpec),
  adminTabs: [{ to: '/admin/france', label: 'Paramètres', end: true }],
  adminRoutes: [
    { index: true, lazy: () => import('./FranceSettings.tsx').then((m) => ({ Component: m.default })) },
  ],
  progression: buildProgressionEntry({
    getEndpoint: franceApi.endpoints.getFranceProgression,
    resetEndpoint: franceApi.endpoints.resetFranceProgression,
  }),
};
