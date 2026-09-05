import type { ModuleManifest } from 'src/types/modules.types';
import Puissance4Game from './Puissance4Game';

export const puissance4Module: ModuleManifest = {
  id: 'puissance4',
  category: 'jeux',
  setupOptions: [
    // Le module déclare SA clé `difficulty` : sans elle, le pré-jeu injecte la sienne —
    // « 2 choix / 4 choix / Saisie libre » — qui ne veut rien dire sur un plateau, et le
    // jeu posait deux fois la même question.
    //
    // « À deux » n'est plus ici : c'est un bouton sur le plateau, où passer la main ne
    // demande plus de ressortir du jeu.
    {
      key: 'difficulty',
      type: 'single',
      label: 'Quel niveau ?',
      choices: [
        { value: 'easy', icon: '🙂', label: 'Facile', description: 'Il joue au hasard' },
        { value: 'medium', icon: '🤔', label: 'Moyen', description: 'Il gagne et il bloque' },
        // Pas de « il ne perd jamais » ici, contrairement au morpion : le Puissance 4
        // n'est pas explorable en entier, donc il reste battable.
        { value: 'hard', icon: '🤖', label: 'Difficile', description: 'Il anticipe' },
      ],
    },
  ],
  child: { Game: Puissance4Game },
  adminTabs: [],
  adminRoutes: [],
};
