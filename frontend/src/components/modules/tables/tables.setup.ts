import store from 'src/store';
import { api } from 'src/store/api/api';
import type { SetupOption } from 'src/components/common/Game/GamePreSetup';

/**
 * Liste des tables à proposer (0→10), filtrée par le réglage `tables_include_trivial`
 * (lu via le cache RTK Query, sans hook). Exécuté par <ModulePreSetup>.
 */
async function loadTables() {
  const settings = await store.dispatch(api.endpoints.getSettings.initiate()).unwrap();
  const includeTrivial = settings.tables_include_trivial !== 'false';
  return Array.from({ length: 11 }, (_, table) => table)
    .filter((table) => includeTrivial || table > 1)
    .map((table) => ({ value: String(table), label: `×${table}` }));
}

export const TABLES_SETUP_OPTIONS: SetupOption[] = [
  { key: 'tables', type: 'multi', label: 'Quelles tables ?', loader: loadTables },
];
