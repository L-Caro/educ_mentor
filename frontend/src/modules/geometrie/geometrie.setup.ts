import type { SetupOption } from 'src/types/game.types';

export const GEOMETRIE_SETUP_OPTIONS: SetupOption[] = [
  {
    key: 'questionTypes',
    type: 'multi',
    label: 'Quoi travailler ?',
    choices: [
      { value: 'nom_figure', icon: '🔺', label: 'Figures planes', description: 'Nommer une figure' },
      { value: 'nom_solide', icon: '📦', label: 'Solides', description: 'Nommer un solide' },
      { value: 'cotes_sommets', icon: '🔢', label: 'Côtés et sommets', description: 'Les compter' },
      { value: 'angle_droit', icon: '📐', label: 'Angle droit', description: 'Le repérer' },
      { value: 'proprietes', icon: '⚖️', label: 'Propriétés', description: 'Départager deux figures proches' },
    ],
  },
];
