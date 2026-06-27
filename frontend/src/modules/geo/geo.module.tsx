import { geoApi } from './geo.api.ts';
import type { ModuleManifest } from 'src/types/modules.types.ts';
import { buildProgressionEntry } from 'src/store/api/progressionEndpoints';

export const geoModule: ModuleManifest = {
  id: 'geo',
  setupOptions: [], // Les types actifs sont configurés en admin → seule la difficulté est choisie ici
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