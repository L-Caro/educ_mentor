import type { ModuleManifest } from 'src/types/modules.types';
import { penduApi } from './pendu.api';
import { PENDU_SETUP_OPTIONS } from './pendu.setup';
import { buildProgressionEntry } from 'src/store/api/progressionEndpoints';
import PenduGame from './PenduGame';

export const penduModule: ModuleManifest = {
  id: 'pendu',
  category: 'jeux',
  skipDifficulty: true,
  setupOptions: PENDU_SETUP_OPTIONS,
  child: { Game: PenduGame },
  adminTabs: [
    { to: '/admin/pendu', label: 'Mots', end: true },
    { to: '/admin/pendu/settings', label: 'Paramètres' },
  ],
  adminRoutes: [
    {
      index: true,
      lazy: () => import('./admin/PenduWordList').then((m) => ({ Component: m.default })),
    },
    {
      path: 'settings',
      lazy: () => import('./admin/PenduSettings').then((m) => ({ Component: m.default })),
    },
    {
      path: 'mots/nouveau',
      lazy: () => import('./admin/PenduWordForm').then((m) => ({ Component: m.default })),
    },
    {
      path: 'mots/:id',
      lazy: () => import('./admin/PenduWordForm').then((m) => ({ Component: m.default })),
    },
  ],
  progression: buildProgressionEntry({
    getEndpoint: penduApi.endpoints.getPenduProgression,
    resetEndpoint: penduApi.endpoints.resetPenduProgression,
  }),
};