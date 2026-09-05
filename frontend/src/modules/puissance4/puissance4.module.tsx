import type { ModuleManifest } from 'src/types/modules.types';
import Puissance4Game from './Puissance4Game';

export const puissance4Module: ModuleManifest = {
  id: 'puissance4',
  category: 'jeux',
  setupOptions: [
    {
      key: 'adversaire',
      type: 'single',
      label: 'Contre qui ?',
      choices: [
        { value: 'facile', icon: '🙂', label: 'Facile', description: 'Il joue au hasard' },
        { value: 'moyen', icon: '🤔', label: 'Moyen', description: 'Il gagne et il bloque' },
        // Pas de « il ne perd jamais » ici, contrairement au morpion : le Puissance 4
        // n'est pas explorable en entier, donc il reste battable.
        { value: 'difficile', icon: '🤖', label: 'Difficile', description: 'Il anticipe' },
        { value: 'deux', icon: '👥', label: 'À deux', description: 'Sur le même écran' },
      ],
    },
  ],
  child: { Game: Puissance4Game },
  adminTabs: [],
  adminRoutes: [],
};
