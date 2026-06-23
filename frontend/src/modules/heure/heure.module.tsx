import { heureApi } from './heure.api.ts';
import type { ModuleManifest } from 'src/types/modules.types.ts';
import { buildProgressionEntry } from 'src/store/api/progressionEndpoints';
import type { SetupOption } from 'src/types/game.types.ts';

const HEURE_SETUP_OPTIONS: SetupOption[] = [
  {
    key: 'questionMode',
    type: 'single',
    label: 'Mode de jeu',
    choices: [
      { value: 'digital',    icon: '🕐', label: 'Heure digitale', description: 'Lire l\'heure exacte' },
      { value: 'expression', icon: '💬', label: 'Expressions',    description: 'et quart, et demie, moins le quart…' },
    ],
  },
  {
    key: 'numeralType',
    type: 'single',
    label: 'Chiffres sur le cadran',
    choices: [
      { value: 'arabic', icon: '1',  label: 'Classique', description: '(1, 2, 3…)' },
      { value: 'roman',  icon: 'Ⅰ',  label: 'Romain',   description: '(I, II, III…)' },
      { value: 'random', icon: '🎲', label: 'Aléatoire', description: 'Mix des deux' },
    ],
  },
];

export const heureModule: ModuleManifest = {
  id: 'heure',
  setupOptions: HEURE_SETUP_OPTIONS,
  loadGameSpec: () => import('./heure.game.tsx').then((module) => module.heureGameSpec),
  adminTabs: [{ to: '/admin/heure', label: 'Paramètres', end: true }],
  adminRoutes: [
    { index: true, lazy: () => import('./HeureSettings.tsx').then((module) => ({ Component: module.default })) },
  ],
  progression: buildProgressionEntry({
    getEndpoint: heureApi.endpoints.getHeureProgression,
    resetEndpoint: heureApi.endpoints.resetHeureProgression,
  }),
};
