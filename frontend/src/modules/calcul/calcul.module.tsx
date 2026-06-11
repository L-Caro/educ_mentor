import store from 'src/store';
import { calculApi } from './calcul.api.ts';
import type { ModuleManifest } from 'src/modules.types.ts';
import type { SetupOption } from 'src/components/game/GamePreSetup.tsx';

const CALCUL_SETUP_OPTIONS: SetupOption[] = [
  {
    key: 'operationTypes',
    type: 'multi',
    label: 'Quoi travailler ?',
    choices: [
      { value: 'complement', label: 'Compléments', description: '3 + ? = 10' },
      { value: 'addition', label: 'Additions', description: '3 + 4 = ?' },
      { value: 'soustraction', label: 'Soustractions', description: '10 − 3 = ?' },
      { value: 'double', label: 'Doubles', description: 'Double de 6 = ?' },
      { value: 'moitie', label: 'Moitiés', description: 'Moitié de 12 = ?' },
    ],
  },
];

export const calculModule: ModuleManifest = {
  id: 'calcul-mental',
  setupOptions: CALCUL_SETUP_OPTIONS,
  loadGameSpec: () => import('./calcul.game.tsx').then((module) => module.calculGameSpec),
  child: {},
  adminTabs: [{ to: '/admin/calcul-mental', label: 'Paramètres', end: true }],
  adminRoutes: [
    { index: true, lazy: () => import('./CalculSettings.tsx').then((module) => ({ Component: module.default })) },
  ],
  progression: {
    getStats: () =>
      store.dispatch(calculApi.endpoints.getCalculProgression.initiate(undefined, { forceRefetch: true })).unwrap(),
    reset: async () => {
      await store.dispatch(calculApi.endpoints.resetCalculProgression.initiate()).unwrap();
    },
  },
};
