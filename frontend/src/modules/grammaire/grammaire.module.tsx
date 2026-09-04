import type { ModuleManifest } from 'src/types/modules.types';
import { grammaireApi } from './grammaire.api';
import { GRAMMAIRE_SETUP_OPTIONS } from './grammaire.setup';
import { buildProgressionEntry } from 'src/store/api/progressionEndpoints';

export const grammaireModule: ModuleManifest = {
  id: 'grammaire',
  category: 'francais',
  setupOptions: GRAMMAIRE_SETUP_OPTIONS,
  loadGameSpec: () =>
    import('./grammaire.game.tsx').then((m) => m.grammaireGameSpec),
  adminTabs: [{ to: '/admin/grammaire', label: 'Notions actives', end: true }],
  adminRoutes: [
    {
      index: true,
      lazy: () =>
        import('./admin/GrammaireNotions.tsx').then((m) => ({
          Component: m.default,
        })),
    },
  ],
  progression: buildProgressionEntry({
    getEndpoint: grammaireApi.endpoints.getGrammaireProgression,
    resetEndpoint: grammaireApi.endpoints.resetGrammaireProgression,
  }),
};
