import type { ModuleManifest } from 'src/types/modules.types';
import TetrisGame from './TetrisGame';

/**
 * Tetris.
 *
 * `skipDifficulty` : facile/normal/difficile ne veut rien dire ici. Ce qui fait la
 * difficulte, c'est la VITESSE de chute, et elle monte toute seule au fil des lignes. Le
 * reglage ne choisit donc que le point de depart : commencer au niveau des grands quand
 * on debute, c'est perdre avant d'avoir compris ou vont les pieces.
 */
export const tetrisModule: ModuleManifest = {
  id: 'tetris',
  category: 'jeux',
  skipDifficulty: true,
  setupOptions: [
    {
      key: 'vitesse',
      type: 'single',
      label: 'Vitesse de départ',
      choices: [
        {
          value: '0',
          label: 'Très lente',
          description: 'On a le temps de réfléchir',
        },
        { value: '2', label: 'Lente' },
        { value: '4', label: 'Normale' },
        { value: '6', label: 'Rapide', description: 'Pour les habitués' },
      ],
    },
    {
      key: 'ombre',
      type: 'single',
      label: 'Montrer où la pièce va tomber',
      choices: [
        {
          value: 'oui',
          label: 'Oui',
          description: 'Un contour marque la place',
        },
        { value: 'non', label: 'Non', description: 'Comme sur les vieux jeux' },
      ],
    },
  ],
  child: { Game: TetrisGame },
  adminTabs: [],
  adminRoutes: [],
};
