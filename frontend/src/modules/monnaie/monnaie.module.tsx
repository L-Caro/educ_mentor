import store from 'src/store';
import { monnaieApi } from './monnaie.api.ts';
import type { ModuleManifest } from 'src/types/modules.types.ts';
import type { SetupOption } from 'src/types/game.types.ts';

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
  setupOptions: MONNAIE_SETUP_OPTIONS,
  loadGameSpec: () => import('./monnaie.game.tsx').then((module) => module.monnaieGameSpec),
  adminTabs: [{ to: '/admin/monnaie', label: 'Paramètres', end: true }],
  adminRoutes: [
    { index: true, lazy: () => import('./MonnaieSettings.tsx').then((module) => ({ Component: module.default })) },
  ],
  progression: {
    getStats: () =>
      store.dispatch(monnaieApi.endpoints.getMonnaieProgression.initiate(undefined, { forceRefetch: true })).unwrap(),
    reset: async () => {
      await store.dispatch(monnaieApi.endpoints.resetMonnaieProgression.initiate()).unwrap();
    },
  },
};
