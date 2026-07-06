import type { ModuleManifest } from 'src/types/modules.types';
import { memoryApi } from './memory.api';
import { MEMORY_SETUP_OPTIONS } from './memory.setup';
import { buildProgressionEntry } from 'src/store/api/progressionEndpoints';
import MemoryGame from './MemoryGame';

export const memoryModule: ModuleManifest = {
  id: 'memory',
  category: 'jeux',
  skipDifficulty: true,
  setupOptions: MEMORY_SETUP_OPTIONS,
  child: { Game: MemoryGame },
  adminTabs: [{ to: '/admin/memory', label: 'Paramètres', end: true }],
  adminRoutes: [
    {
      index: true,
      lazy: () => import('./admin/MemoryAdmin').then((m) => ({ Component: m.default })),
    },
  ],
  progression: buildProgressionEntry({
    getEndpoint: memoryApi.endpoints.getMemoryProgression,
    resetEndpoint: memoryApi.endpoints.resetMemoryProgression,
  }),
};