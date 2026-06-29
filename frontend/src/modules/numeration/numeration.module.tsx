import type { ModuleManifest } from 'src/types/modules.types';
import { numerationApi } from './numeration.api';
import { buildProgressionEntry } from 'src/store/api/progressionEndpoints';

export const numerationModule: ModuleManifest = {
  id:             'numeration',
  skipDifficulty: true,
  setupOptions: [
    {
      key:   'questionTypes',
      type:  'multi',
      label: 'Quoi travailler ?',
      choices: [
        { value: 'comparaison',          icon: '⚖️',  label: 'Comparaison',       description: '47  □  53  →  < = >' },
        { value: 'suite',                icon: '➡️',  label: 'Suites',            description: '10, 20, 30, ...' },
        { value: 'decomposition',        icon: '🔓',  label: 'Décomposition',     description: '347 = 3 centaines, 4 dizaines, 7 unités' },
        { value: 'valeur_positionnelle', icon: '🎯',  label: 'Valeur position.',  description: 'Dans 347, quel est le chiffre des dizaines ?' },
      ],
    },
  ],
  loadGameSpec: () => import('./numeration.game.tsx').then((m) => m.numerationGameSpec),
  adminTabs:   [{ to: '/admin/numeration', label: 'Paramètres', end: true }],
  adminRoutes: [
    { index: true, lazy: () => import('./admin/NumerationSettings.tsx').then((m) => ({ Component: m.default })) },
  ],
  progression: buildProgressionEntry({
    getEndpoint:   numerationApi.endpoints.getNumerationProgression,
    resetEndpoint: numerationApi.endpoints.resetNumerationProgression,
  }),
};