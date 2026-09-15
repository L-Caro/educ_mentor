import type { ModuleManifest } from 'src/types/modules.types';
import ProgrammationGame from './ProgrammationGame';
import { THEMES } from './themes';

/**
 * Programmer un deplacement.
 *
 * `skipDifficulty` : la difficulte commune (facile/normal/difficile) ne veut rien dire
 * ici. Ce qui fait la difficulte, c'est le PARCOURS, et il merite sa propre question
 * parce qu'il ne regle pas la meme chose : il decide de ce que l'enfant doit se
 * representer.
 */
export const programmationModule: ModuleManifest = {
  id: 'programmation',
  category: 'jeux',
  skipDifficulty: true,
  setupOptions: [
    {
      key: 'parcours',
      type: 'single',
      label: 'Comment donner les ordres',
      choices: [
        {
          value: 'enfant',
          icon: '↑',
          label: 'Vers le haut, vers la droite',
          description: 'Les flèches de l’écran : le personnage se tourne tout seul',
        },
        {
          value: 'robot',
          icon: '↱',
          label: 'Avance et tourne',
          description: 'La gauche du personnage, pas la tienne. Plus difficile',
        },
      ],
    },
    {
      key: 'theme',
      type: 'single',
      label: 'Qui joue',
      choices: THEMES.map((t) => ({ value: t.cle, label: t.label })),
    },
    {
      key: 'grille',
      type: 'single',
      label: 'Taille du terrain',
      choices: [
        { value: '5', label: '5 sur 5' },
        { value: '6', label: '6 sur 6' },
        { value: '7', label: '7 sur 7' },
        { value: '8', label: '8 sur 8' },
      ],
    },
  ],
  child: { Game: ProgrammationGame },
  adminTabs: [],
  adminRoutes: [],
};
