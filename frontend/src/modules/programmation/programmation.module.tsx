import type { ModuleManifest } from 'src/types/modules.types';
import ProgrammationGame from './ProgrammationGame';
import { BUTS, PERSONNAGES, SOLS } from './themes';

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
      key: 'personnage',
      type: 'single',
      label: 'Qui joue',
      choices: PERSONNAGES.map((p) => ({ value: p.cle, label: p.label })),
    },
    {
      key: 'but',
      type: 'single',
      label: 'Ce qu’il faut atteindre',
      choices: BUTS.map((b) => ({ value: b.cle, label: b.label })),
    },
    {
      key: 'sol',
      type: 'single',
      label: 'Où l’on joue',
      choices: SOLS.map((s) => ({ value: s.cle, label: s.label })),
    },
    {
      key: 'grille',
      type: 'single',
      label: 'Taille du terrain',
      choices: [
        { value: '8', label: '8 sur 8' },
        { value: '12', label: '12 sur 12' },
        { value: '16', label: '16 sur 16' },
        { value: '20', label: '20 sur 20' },
      ],
    },
  ],
  child: { Game: ProgrammationGame },
  adminTabs: [],
  adminRoutes: [],
};
