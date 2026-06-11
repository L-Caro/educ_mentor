import store from 'src/store';
import { api } from 'src/store/api/api';
import type { ModuleManifest } from 'src/modules.types';
import { imagierGameSpec } from './imagier.game';
import { IMAGIER_SETUP_OPTIONS } from './imagier.setup';
import ImagierWordList from './admin/ImagierWordList';
import ImagierWordForm from './admin/ImagierWordForm';
import ImagierImageImport from './admin/ImagierImageImport';
import ImagierSettings from './admin/ImagierSettings';

export const imagierModule: ModuleManifest = {
  id: 'imagier',
  label: 'Imagier Anglais',
  icon: '🇬🇧',
  setupOptions: IMAGIER_SETUP_OPTIONS,
  gameSpec: imagierGameSpec,
  child: {},
  adminTabs: [
    { to: '/admin/imagier', label: 'Mots', end: true },
    { to: '/admin/imagier/images', label: 'Images' },
    { to: '/admin/imagier/settings', label: 'Paramètres' },
  ],
  adminRoutes: [
    { index: true, element: <ImagierWordList /> },
    { path: 'images', element: <ImagierImageImport /> },
    { path: 'settings', element: <ImagierSettings /> },
    { path: 'mots/:id', element: <ImagierWordForm /> },
  ],
  progression: {
    getStats: () =>
      store.dispatch(api.endpoints.getImagierProgression.initiate(undefined, { forceRefetch: true })).unwrap(),
    reset: async () => {
      await store.dispatch(api.endpoints.resetImagierProgression.initiate()).unwrap();
    },
  },
};
