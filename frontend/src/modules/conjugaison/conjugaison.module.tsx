import { conjugaisonApi } from './conjugaison.api.ts';
import type { ModuleManifest } from 'src/types/modules.types.ts';
import type { SetupOption } from 'src/types/game.types.ts';
import { buildProgressionEntry } from 'src/store/api/progressionEndpoints';

const CONJUGAISON_SETUP_OPTIONS: SetupOption[] = [
  {
    key: 'tenses',
    type: 'multi',
    label: 'Temps',
    choices: [
      { value: 'présent',   label: 'Présent',      description: 'Je mange' },
      { value: 'imparfait', label: 'Imparfait',    description: 'Je mangeais' },
      { value: 'futur',     label: 'Futur simple', description: 'Je mangerai' },
    ],
  },
  {
    key: 'verbGroups',
    type: 'multi',
    label: 'Groupes de verbes',
    choices: [
      { value: 'auxiliaire', label: 'Auxiliaires', description: 'être, avoir' },
      { value: '1',          label: '1er groupe',  description: 'chanter, jouer…' },
      { value: '2',          label: '2ème groupe', description: 'finir, choisir…' },
      { value: '3',          label: '3ème groupe', description: 'aller, faire…' },
    ],
  },
  {
    key: 'pronounDisplay',
    type: 'single',
    label: 'Affichage des pronoms',
    choices: [
      { value: 'personal',    icon: '💬', label: 'Je, Tu, Il…',         description: 'Pronoms personnels' },
      { value: 'grammatical', icon: '🔤', label: '1ère pers. du sing.', description: 'Étiquettes grammaticales' },
      { value: 'random',      icon: '🎲', label: 'Aléatoire',           description: 'Mix des deux' },
    ],
  },
  {
    key: 'questionDirection',
    type: 'single',
    label: 'Sens de la question',
    choices: [
      { value: 'forward', icon: '→', label: 'Infinitif → Conjugué', description: 'Conjuguer le verbe' },
      { value: 'reverse', icon: '←', label: 'Conjugué → Infinitif', description: "Trouver l'infinitif" },
      { value: 'random',  icon: '🎲', label: 'Aléatoire',           description: 'Mix des deux' },
    ],
  },
];

export const conjugaisonModule: ModuleManifest = {
  id: 'conjugaison',
  setupOptions: CONJUGAISON_SETUP_OPTIONS,
  loadGameSpec: () => import('./conjugaison.game.tsx').then((m) => m.conjugaisonGameSpec),
  adminTabs: [{ to: '/admin/conjugaison', label: 'Paramètres', end: true }],
  adminRoutes: [
    { index: true, lazy: () => import('./ConjugaisonSettings.tsx').then((m) => ({ Component: m.default })) },
  ],
  progression: buildProgressionEntry({
    getEndpoint: conjugaisonApi.endpoints.getConjugaisonProgression,
    resetEndpoint: conjugaisonApi.endpoints.resetConjugaisonProgression,
  }),
};