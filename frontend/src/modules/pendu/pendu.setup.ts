import type { SetupOption } from 'src/types/game.types.ts';

export const PENDU_SETUP_OPTIONS: SetupOption[] = [
  {
    key: 'difficulty',
    type: 'single',
    label: 'Niveau des mots',
    choices: [
      { value: 'easy', label: 'Facile' },
      { value: 'normal', label: 'Normal' },
      { value: 'hard', label: 'Difficile' },
    ],
  },
  {
    key: 'word_length',
    type: 'single',
    label: 'Longueur du mot',
    choices: [
      { value: 'short', label: 'Court', description: '5 – 6 lettres' },
      { value: 'medium', label: 'Moyen', description: '7 – 8 lettres' },
      { value: 'long', label: 'Long', description: '9 lettres et plus' },
      { value: 'any', label: 'Peu importe' },
    ],
  },
  {
    key: 'letters_revealed',
    type: 'single',
    label: 'Lettres offertes',
    choices: [
      { value: '1', label: '1 lettre' },
      { value: '2', label: '2 lettres' },
      { value: '3', label: '3 lettres' },
      { value: '0', label: 'Aucune' },
    ],
  },
];