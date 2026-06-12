import { tablesApi } from './tables.api.ts';
import type { ModuleManifest } from 'src/types/modules.types.ts';
import { buildProgressionEntry } from 'src/store/api/progressionEndpoints';
import { TABLES_SETUP_OPTIONS } from './tables.setup.ts';

export const tablesModule: ModuleManifest = {
  id: 'tables',
  setupOptions: TABLES_SETUP_OPTIONS,
  loadGameSpec: () => import('./tables.game.tsx').then((module) => module.tablesGameSpec),
  adminTabs: [{ to: '/admin/tables', label: 'Paramètres', end: true }],
  adminRoutes: [
    { index: true, lazy: () => import('./TablesSettings.tsx').then((module) => ({ Component: module.default })) },
  ],
  progression: buildProgressionEntry({
    getEndpoint: tablesApi.endpoints.getTablesProgression,
    resetEndpoint: tablesApi.endpoints.resetTablesProgression,
  }),
};
