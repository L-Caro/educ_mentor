import type { ModuleManifest } from 'src/types/modules.types';
import { geometrieApi } from './geometrie.api';
import { GEOMETRIE_SETUP_OPTIONS } from './geometrie.setup';
import { buildProgressionEntry } from 'src/store/api/progressionEndpoints';

export const geometrieModule: ModuleManifest = {
  id: 'geometrie',
  category: 'maths',
  setupOptions: GEOMETRIE_SETUP_OPTIONS,
  loadGameSpec: () => import('./geometrie.game.tsx').then((m) => m.geometrieGameSpec),
  adminTabs: [{ to: '/admin/geometrie', label: 'Figures actives', end: true }],
  adminRoutes: [
    {
      index: true,
      lazy: () => import('./admin/GeometrieSettings.tsx').then((m) => ({ Component: m.default })),
    },
  ],
  progression: buildProgressionEntry({
    getEndpoint: geometrieApi.endpoints.getGeometrieProgression,
    resetEndpoint: geometrieApi.endpoints.resetGeometrieProgression,
  }),
};
