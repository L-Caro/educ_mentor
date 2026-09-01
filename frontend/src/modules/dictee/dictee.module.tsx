import type { ModuleManifest } from 'src/types/modules.types';
import { buildProgressionEntry } from 'src/store/api/progressionEndpoints';
import { dicteeApi } from './dictee.api';
import { DICTEE_SETUP_OPTIONS } from './dictee.setup';
import DicteeGame from './DicteeGame';

export const dicteeModule: ModuleManifest = {
  id: 'dictee',
  category: 'francais',
  skipDifficulty: true,
  setupOptions: DICTEE_SETUP_OPTIONS,
  child: { Game: DicteeGame },
  adminTabs: [{ to: '/admin/dictee', label: 'Contenu', end: true }],
  adminRoutes: [
    {
      index: true,
      lazy: () =>
        import('./admin/DicteeAdmin').then((m) => ({ Component: m.default })),
    },
  ],
  progression: buildProgressionEntry({
    getEndpoint: dicteeApi.endpoints.getDicteeProgression,
    resetEndpoint: dicteeApi.endpoints.resetDicteeProgression,
  }),
};
