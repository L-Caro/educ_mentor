import store from 'src/store';
import { api } from 'src/store/api/api';
import type { ModuleManifest } from 'src/modules.types';
import { tablesGameSpec } from './tables.game';
import { TABLES_SETUP_OPTIONS } from './tables.setup';
import TablesSettings from './admin/TablesSettings';

export const tablesModule: ModuleManifest = {
  id: 'tables',
  label: 'Tables de multiplication',
  icon: '✖️',
  setupOptions: TABLES_SETUP_OPTIONS,
  gameSpec: tablesGameSpec,
  child: {},
  adminTabs: [{ to: '/admin/tables', label: 'Paramètres', end: true }],
  adminRoutes: [{ index: true, element: <TablesSettings /> }],
  progression: {
    getStats: () =>
      store.dispatch(api.endpoints.getTablesProgression.initiate(undefined, { forceRefetch: true })).unwrap(),
    reset: async () => {
      await store.dispatch(api.endpoints.resetTablesProgression.initiate()).unwrap();
    },
  },
};
