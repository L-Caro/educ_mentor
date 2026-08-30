import store from 'src/store';
import { sharedApi } from 'src/store/api/sharedApi.ts';
import { getCategoryConfig, getSubcategoryLabel } from 'src/modules/imagier/constants/categories.ts';
import type { SetupChoice, SetupOption } from 'src/types/game.types.ts';

/**
 * Charge l'arbre des catégories via le cache RTK Query (`initiate` = cache sans hook).
 * Les deux loaders partagent la même requête, dédupliquée par le cache.
 */
function loadCategoryTree() {
  return store.dispatch(sharedApi.endpoints.getImagierCategories.initiate()).unwrap();
}

async function loadThemes(): Promise<SetupChoice[]> {
  const tree = await loadCategoryTree();
  return tree
    .filter((entry) => entry.active_count > 0)
    .map((entry) => {
      const config = getCategoryConfig(entry.category);
      return { value: entry.category, label: config.label, icon: config.icon };
    });
}

/** Toutes les sous-catégories à plat, taguées par leur thème parent (cf. <GamePreSetup> `dependsOn`). */
async function loadSubcategories(): Promise<SetupChoice[]> {
  const tree = await loadCategoryTree();
  return tree.flatMap((entry) =>
    entry.subcategories
      .filter((sub) => sub.active_count > 0)
      .map((sub) => ({
        value: sub.subcategory,
        label: getSubcategoryLabel(sub.subcategory),
        parent: entry.category,
      })),
  );
}

export const IMAGIER_SETUP_OPTIONS: SetupOption[] = [
  {
    key: 'mode',
    type: 'single',
    label: 'Dans quel sens ?',
    choices: [
      { value: 'fr_to_en', icon: '🇫🇷', label: 'Français → Anglais' },
      { value: 'en_to_fr', icon: '🇬🇧', label: 'Anglais → Français' },
      { value: 'random', icon: '🔀', label: 'Aléatoire' },
    ],
  },
  { key: 'category', type: 'single', label: 'Choisis un thème !', loader: loadThemes },
  {
    key: 'subcategories',
    type: 'multi',
    label: 'Précise (facultatif)',
    dependsOn: 'category',
    loader: loadSubcategories,
  },
];
