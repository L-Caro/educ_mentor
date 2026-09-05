import store from 'src/store';
import { calculApi } from './calcul.api.ts';
import type { ModuleManifest } from 'src/types/modules.types.ts';
import type { SetupChoice, SetupOption } from 'src/types/game.types.ts';
import { buildProgressionEntry } from 'src/store/api/progressionEndpoints';

/** Les types viennent du SERVEUR : ce sont ceux ouverts dans Administration → Calcul
 * mental. Les coder en dur laisserait un CE1 cocher « division », que le service
 * filtrerait ensuite — la partie servirait autre chose que ce qui a été coché. */
async function loadTypes(): Promise<SetupChoice[]> {
  try {
    const types = await store
      .dispatch(calculApi.endpoints.getCalculTypes.initiate(undefined))
      .unwrap();
    return types.map((t) => ({
      value: t.key,
      label: t.label,
      description: t.exemple,
    }));
  } catch {
    // Repli sûr : l'additif de base, actif à l'installation.
    return [
      { value: 'addition', label: 'Additions', description: '3 + 4 = ?' },
      { value: 'soustraction', label: 'Soustractions', description: '10 − 3 = ?' },
    ];
  }
}

const CALCUL_SETUP_OPTIONS: SetupOption[] = [
  {
    key: 'operationTypes',
    type: 'multi',
    label: 'Quoi travailler ?',
    loader: loadTypes,
    emptyMessage:
      'Aucun type actif. Ouvre-les dans Administration → Calcul mental.',
  },
];

export const calculModule: ModuleManifest = {
  id: 'calcul-mental',
  category: 'maths',
  setupOptions: CALCUL_SETUP_OPTIONS,
  loadGameSpec: () => import('./calcul.game.tsx').then((module) => module.calculGameSpec),
  adminTabs: [{ to: '/admin/calcul-mental', label: 'Paramètres', end: true }],
  adminRoutes: [
    { index: true, lazy: () => import('./CalculSettings.tsx').then((module) => ({ Component: module.default })) },
  ],
  progression: buildProgressionEntry({
    getEndpoint: calculApi.endpoints.getCalculProgression,
    resetEndpoint: calculApi.endpoints.resetCalculProgression,
  }),
};
