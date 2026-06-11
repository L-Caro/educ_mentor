import store from 'src/store';
import { api } from 'src/store/api/api';
import type { ModuleManifest } from 'src/modules.types';
import { IMAGIER_SETUP_OPTIONS } from './imagier.setup';

export const imagierModule: ModuleManifest = {
  id: 'imagier',
  setupOptions: IMAGIER_SETUP_OPTIONS,
  loadGameSpec: () => import('./imagier.game').then((module) => module.imagierGameSpec),
  child: {},
  adminTabs: [
    { to: '/admin/imagier', label: 'Mots', end: true },
    { to: '/admin/imagier/images', label: 'Images' },
    { to: '/admin/imagier/settings', label: 'Paramètres' },
  ],
  adminRoutes: [
    { index: true, lazy: () => import('./admin/ImagierWordList').then((module) => ({ Component: module.default })) },
    { path: 'images', lazy: () => import('./admin/ImagierImageImport').then((module) => ({ Component: module.default })) },
    { path: 'settings', lazy: () => import('./admin/ImagierSettings').then((module) => ({ Component: module.default })) },
    { path: 'mots/:id', lazy: () => import('./admin/ImagierWordForm').then((module) => ({ Component: module.default })) },
  ],
  progression: {
    getStats: () =>
      store.dispatch(api.endpoints.getImagierProgression.initiate(undefined, { forceRefetch: true })).unwrap(),
    reset: async () => {
      await store.dispatch(api.endpoints.resetImagierProgression.initiate()).unwrap();
    },
  },
};
