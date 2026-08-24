import type { ModuleManifest } from 'src/types/modules.types';
import type { SetupOption } from 'src/types/game.types';
import { poseApi } from './pose.api';
import { buildProgressionEntry } from 'src/store/api/progressionEndpoints';

/** La difficulté commande l'échafaudage des retenues, pas la taille des nombres :
 * celle-ci est un réglage d'administration, parce qu'elle dépend du niveau de classe
 * et non de l'humeur du jour. */
const POSE_SETUP_OPTIONS: SetupOption[] = [
  {
    key: 'operations',
    type: 'multi',
    label: 'Quelle opération ?',
    choices: [
      { value: 'addition', icon: '+', label: 'Additions', description: 'avec et sans retenue' },
      { value: 'soustraction', icon: '−', label: 'Soustractions', description: 'avec et sans retenue' },
    ],
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
