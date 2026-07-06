import store from 'src/store';
import { sharedApi } from 'src/store/api/sharedApi.ts';
import { getCategoryConfig } from 'src/modules/imagier/constants/categories.ts';
import type { SetupOption } from 'src/types/game.types.ts';

async function loadCategories() {
  const categories = await store.dispatch(sharedApi.endpoints.getImagierCategories.initiate()).unwrap();
  return categories
    .filter((c) => c.active_count > 0)
    .map((c) => {
      const config = getCategoryConfig(c.category);
      return { value: c.category, label: config.label, icon: config.icon };
    });
}

export const MEMORY_SETUP_OPTIONS: SetupOption[] = [
  {
    key: 'pairs_count',
    type: 'single',
    label: 'Nombre de paires',
    choices: [
      { value: '4', label: '4 paires' },
      { value: '6', label: '6 paires' },
      { value: '8', label: '8 paires' },
      { value: '12', label: '12 paires' },
      { value: '16', label: '16 paires' },
      { value: '20', label: '20 paires' },
      { value: '24', label: '24 paires' },
      { value: '28', label: '28 paires' },
    ],
  },
  {
    key: 'mode',
    type: 'single',
    label: 'Type de jeu',
    choices: [
      { value: 'image', label: 'Images identiques' },
      { value: 'image_word_fr', icon: '🇫🇷', label: 'Image + mot français' },
      { value: 'image_word_en', icon: '🇬🇧', label: 'Image + mot anglais' },
    ],
  },
  {
    key: 'categories',
    type: 'multi',
    label: 'Thèmes',
    loader: loadCategories,
    emptyMessage: 'Aucun thème disponible',
  },
];