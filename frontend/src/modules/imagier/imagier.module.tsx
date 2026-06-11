import store from 'src/store';
import { imagierApi } from './imagier.api.ts';
import type { ModuleManifest } from 'src/modules.types.ts';
import { IMAGIER_SETUP_OPTIONS } from './imagier.setup.ts';

export const imagierModule: ModuleManifest = {
  id: 'imagier',
  setupOptions: IMAGIER_SETUP_OPTIONS,
  loadGameSpec: () => import('./imagier.game.tsx').then((module) => module.imagierGameSpec),
  child: {},
  adminTabs: [
    { to: '/admin/imagier', label: 'Mots', end: true },
    { to: '/admin/imagier/images', label: 'Images' },
    { to: '/admin/imagier/settings', label: 'Paramètres' },
  ],
  adminRoutes: [
    { index: true, lazy: () => import('./admin/ImagierWordList.tsx').then((module) => ({ Component: module.default })) },
    { path: 'images', lazy: () => import('./admin/ImagierImageImport.tsx').then((module) => ({ Component: module.default })) },
    { path: 'settings', lazy: () => import('./ImagierSettings.tsx').then((module) => ({ Component: module.default })) },
    { path: 'mots/:id', lazy: () => import('./admin/ImagierWordForm.tsx').then((module) => ({ Component: module.default })) },
  ],
  progression: {
    getStats: () =>
      store.dispatch(imagierApi.endpoints.getImagierProgression.initiate(undefined, { forceRefetch: true })).unwrap(),
    reset: async () => {
      await store.dispatch(imagierApi.endpoints.resetImagierProgression.initiate()).unwrap();
    },
  },
};
