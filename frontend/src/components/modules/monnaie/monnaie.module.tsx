import store from 'src/store';
import { api } from 'src/store/api/api';
import type { ModuleManifest } from 'src/modules.types';
import type { SetupOption } from 'src/components/common/Game/GamePreSetup';
import { monnaieGameSpec } from './monnaie.game';
import MonnaieSettings from './admin/MonnaieSettings';

const MONNAIE_SETUP_OPTIONS: SetupOption[] = [
  {
    key: 'exerciseType',
    type: 'single',
    label: 'Quel exercice veux-tu faire ?',
    choices: [
      { value: 'reconnaitre', icon: '👀', label: 'Reconnaître', description: 'Compte les pièces et les billets' },
      { value: 'total', icon: '🛒', label: "Total d'achat", description: 'Calcule le prix de tous les articles' },
      { value: 'rendre', icon: '💸', label: 'Rendre la monnaie', description: "Calcule ce qu'on te rend" },
    ],
  },
];

export const monnaieModule: ModuleManifest = {
  id: 'monnaie',
  label: 'Monnaie',
  icon: '💶',
  setupOptions: MONNAIE_SETUP_OPTIONS,
  gameSpec: monnaieGameSpec,
  child: {},
  adminTabs: [{ to: '/admin/monnaie', label: 'Paramètres', end: true }],
  adminRoutes: [{ index: true, element: <MonnaieSettings /> }],
  progression: {
    getStats: () =>
      store.dispatch(api.endpoints.getMonnaieProgression.initiate(undefined, { forceRefetch: true })).unwrap(),
    reset: async () => {
      await store.dispatch(api.endpoints.resetMonnaieProgression.initiate()).unwrap();
    },
  },
};
