import store from 'src/store';
import { tablesApi } from './tables.api';
import type { ModuleManifest } from 'src/modules.types';
import { TABLES_SETUP_OPTIONS } from './tables.setup';

export const tablesModule: ModuleManifest = {
  id: 'tables',
  setupOptions: TABLES_SETUP_OPTIONS,
  loadGameSpec: () => import('./tables.game').then((module) => module.tablesGameSpec),
  child: {},
  adminTabs: [{ to: '/admin/tables', label: 'Paramètres', end: true }],
  adminRoutes: [
    { index: true, lazy: () => import('./admin/TablesSettings').then((module) => ({ Component: module.default })) },
  ],
  progression: {
    getStats: () =>
      store.dispatch(tablesApi.endpoints.getTablesProgression.initiate(undefined, { forceRefetch: true })).unwrap(),
    reset: async () => {
      await store.dispatch(tablesApi.endpoints.resetTablesProgression.initiate()).unwrap();
    },
  },
};
