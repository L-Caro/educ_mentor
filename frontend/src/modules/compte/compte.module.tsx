import store from 'src/store';
import type { ModuleManifest } from 'src/types/modules.types';
import type { SetupChoice, SetupOption } from 'src/types/game.types';
import { compteApi } from './compte.api';
import { buildProgressionEntry } from 'src/store/api/progressionEndpoints';

/** Les opérations viennent du SERVEUR : ce sont celles ouvertes dans Administration →
 * Le compte est bon. Les coder en dur laisserait cocher la division avant qu'elle ait
 * été vue en classe, et le service filtrerait ensuite la case : une partie qui sert autre
 * chose que ce qui a été demandé. */
async function loadOperations(): Promise<SetupChoice[]> {
  try {
    const operations = await store
      .dispatch(compteApi.endpoints.getCompteOperations.initiate(undefined))
      .unwrap();
    return operations.map((operation) => ({
      value: operation.key,
      icon: operation.key === '-' ? '−' : operation.key,
      label: operation.label,
      description: operation.exemple,
    }));
  } catch {
    // Repli sûr : les deux opérations ouvertes à l'installation.
    return [
      { value: '+', icon: '+', label: 'Addition', description: '75 + 25 = 100' },
      { value: '-', icon: '−', label: 'Soustraction', description: '100 − 25 = 75' },
    ];
  }
}

/** La difficulté commune du moteur décrit un nombre de choix de QCM : ce qui ne veut rien
 * dire ici. Le module déclare donc sa propre clé `difficulty`, et le pré-jeu n'injecte
 * plus la sienne : ce qui se règle, c'est la LONGUEUR de la chaîne à trouver. */
const COMPTE_SETUP_OPTIONS: SetupOption[] = [
  {
    key: 'difficulty',
    type: 'single',
    label: 'Quel niveau ?',
    choices: [
      { value: 'easy', icon: '🟢', label: 'Facile', description: '2 opérations, petites plaques' },
      { value: 'medium', icon: '🟡', label: 'Moyen', description: '3 opérations' },
      { value: 'hard', icon: '🔴', label: 'Difficile', description: '4 opérations' },
    ],
  },
  {
    key: 'operations',
    type: 'multi',
    label: 'Quelles opérations ?',
    loader: loadOperations,
    emptyMessage:
      'Aucune opération ouverte. Ouvre-les dans Administration → Le compte est bon.',
  },
];

export const compteModule: ModuleManifest = {
  id: 'compte',
  category: 'maths',
  setupOptions: COMPTE_SETUP_OPTIONS,
  loadGameSpec: () => import('./compte.game.tsx').then((m) => m.compteGameSpec),
  adminTabs: [{ to: '/admin/compte', label: 'Paramètres', end: true }],
  adminRoutes: [
    {
      index: true,
      lazy: () =>
        import('./CompteSettings.tsx').then((m) => ({ Component: m.default })),
    },
  ],
  progression: buildProgressionEntry({
    getEndpoint: compteApi.endpoints.getCompteProgression,
    resetEndpoint: compteApi.endpoints.resetCompteProgression,
  }),
};
