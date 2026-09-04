import type { ModuleManifest } from 'src/types/modules.types';
import { accordsApi } from './accords.api';
import { ACCORDS_SETUP_OPTIONS } from './accords.setup';
import { buildProgressionEntry } from 'src/store/api/progressionEndpoints';

export const accordsModule: ModuleManifest = {
  id: 'accords',
  category: 'francais',
  setupOptions: ACCORDS_SETUP_OPTIONS,
  loadGameSpec: () =>
    import('./accords.game.tsx').then((m) => m.accordsGameSpec),
  adminTabs: [{ to: '/admin/accords', label: 'Exercices actifs', end: true }],
  adminRoutes: [
    {
      index: true,
      lazy: () =>
        import('./admin/AccordsNotions.tsx').then((m) => ({
          Component: m.default,
        })),
    },
  ],
  progression: buildProgressionEntry({
    getEndpoint: accordsApi.endpoints.getAccordsProgression,
    resetEndpoint: accordsApi.endpoints.resetAccordsProgression,
  }),
};
