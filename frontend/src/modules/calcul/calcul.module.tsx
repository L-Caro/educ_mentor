import { calculApi } from './calcul.api.ts';
import type { ModuleManifest } from 'src/types/modules.types.ts';
import type { SetupOption } from 'src/types/game.types.ts';
import { buildProgressionEntry } from 'src/store/api/progressionEndpoints';

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
  category: 'maths',
  setupOptions: CALCUL_SETUP_OPTIONS,
  loadGameSpec: () => import('./calcul.game.tsx').then((module) => module.calculGameSpec),
  adminTabs: [{ to: '/admin/calcul-mental', label: 'Paramètres', end: true }],
  adminRoutes: [
    { index: true, lazy: () => import('./CalculSettings.tsx').then((module) => ({ Component: module.default })) },
  ],
  progression: buildProgressionEntry({
    getEndpoint: calculApi.endpoints.getCalculProgression,
    resetEndpoint: calculApi.endpoints.resetCalculProgression,
  }),
};
