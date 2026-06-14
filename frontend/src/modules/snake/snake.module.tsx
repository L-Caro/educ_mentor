import type { ModuleManifest } from 'src/types/modules.types';
import SnakeGame from './SnakeGame';

export const snakeModule: ModuleManifest = {
  id: 'snake',
  setupOptions: [
    {
      key: 'difficulty',
      type: 'single',
      label: 'Difficulté',
      choices: [
        { value: 'easy', label: 'Facile' },
        { value: 'medium', label: 'Moyen' },
        { value: 'hard', label: 'Difficile' },
      ],
    },
    {
      key: 'theme',
      type: 'single',
      label: 'Thème',
      choices: [
        { value: 'bg1', label: 'Automne' },
        { value: 'bg2', label: 'Sable' },
        { value: 'bg3', label: 'Rubis' },
        { value: 'bg4', label: 'Rose' },
        { value: 'bg5', label: 'Violet' },
        { value: 'bg6', label: 'Lavande' },
        { value: 'bg7', label: 'Ciel' },
        { value: 'bg8', label: 'Terre' },
        { value: 'bg9', label: 'Gris' },
        { value: 'bg10', label: 'Nuit' },
      ],
    },
    {
      key: 'fruit',
      type: 'single',
      label: 'Fruit',
      choices: [
        { value: 'apple', label: 'Pomme' },
        { value: 'abricot', label: 'Abricot' },
        { value: 'fraise', label: 'Fraise' },
        { value: 'poire', label: 'Poire' },
      ],
    },
  ],
  child: { Game: SnakeGame },
  adminTabs: [],
  adminRoutes: [],
};
