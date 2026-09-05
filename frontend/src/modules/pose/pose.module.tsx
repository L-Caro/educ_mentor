import store from 'src/store';
import type { ModuleManifest } from 'src/types/modules.types';
import type { SetupChoice, SetupOption } from 'src/types/game.types';
import { poseApi } from './pose.api';
import { buildProgressionEntry } from 'src/store/api/progressionEndpoints';

/** La difficulté commande l'échafaudage des retenues, pas la taille des nombres :
 * celle-ci est un réglage d'administration, parce qu'elle dépend du niveau de classe
 * et non de l'humeur du jour. */
const SIGNES: Record<string, string> = {
  addition: '+',
  soustraction: '−',
  multiplication: '×',
};

/** Les opérations viennent du SERVEUR : ce sont celles ouvertes dans Administration →
 * Calcul posé. Les coder en dur laisserait cocher la multiplication avant qu'elle ait été
 * vue en classe, et le service filtrerait ensuite la case : une partie qui sert autre
 * chose que ce qui a été demandé. */
async function loadOperations(): Promise<SetupChoice[]> {
  try {
    const operations = await store
      .dispatch(poseApi.endpoints.getPoseOperations.initiate(undefined))
      .unwrap();
    return operations.map((operation) => ({
      value: operation.key,
      icon: SIGNES[operation.key],
      label: operation.label,
      description: operation.exemple,
    }));
  } catch {
    // Repli sûr : les deux opérations actives à l'installation.
    return [
      { value: 'addition', icon: '+', label: 'Additions', description: '247 + 138' },
      { value: 'soustraction', icon: '−', label: 'Soustractions', description: '2847 − 138' },
    ];
  }
}

const POSE_SETUP_OPTIONS: SetupOption[] = [
  {
    key: 'operations',
    type: 'multi',
    label: 'Quelle opération ?',
    loader: loadOperations,
    emptyMessage:
      'Aucune opération active. Ouvre-les dans Administration → Calcul posé.',
  },
];

export const poseModule: ModuleManifest = {
  id: 'pose',
  category: 'maths',
  setupOptions: POSE_SETUP_OPTIONS,
  loadGameSpec: () => import('./pose.game.tsx').then((m) => m.poseGameSpec),
  adminTabs: [{ to: '/admin/pose', label: 'Paramètres', end: true }],
  adminRoutes: [
    { index: true, lazy: () => import('./PoseSettings.tsx').then((m) => ({ Component: m.default })) },
  ],
  progression: buildProgressionEntry({
    getEndpoint: poseApi.endpoints.getPoseProgression,
    resetEndpoint: poseApi.endpoints.resetPoseProgression,
  }),
};
