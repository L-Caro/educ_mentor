import store from 'src/store';
import { api } from 'src/store/api/api';
import { getCategoryConfig } from 'src/components/modules/imagier/constants/categories';
import type { SetupOption } from 'src/components/common/Game/GamePreSetup';

/**
 * Charge les catégories actives via le cache RTK Query (`initiate` = cache sans hook).
 * Exécuté à la demande par <ModulePreSetup> quand l'enfant ouvre le pré-jeu Imagier.
 */
async function loadCategories() {
  const categories = await store.dispatch(api.endpoints.getImagierCategories.initiate()).unwrap();
  return categories
    .filter((category) => category.active_count > 0)
    .map((category) => {
      const config = getCategoryConfig(category.category);
      return { value: category.category, label: config.label, icon: config.icon };
    });
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
  { key: 'categories', type: 'multi', label: 'Choisis les thèmes !', loader: loadCategories },
];
