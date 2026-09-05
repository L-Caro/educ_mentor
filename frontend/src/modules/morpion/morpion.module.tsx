import type { ModuleManifest } from 'src/types/modules.types';
import MorpionGame from './MorpionGame';

export const morpionModule: ModuleManifest = {
  id: 'morpion',
  category: 'jeux',
  setupOptions: [
    {
      key: 'adversaire',
      type: 'single',
      label: 'Contre qui ?',
      choices: [
        { value: 'facile', icon: '🙂', label: 'Facile', description: 'Il joue au hasard' },
        { value: 'moyen', icon: '🤔', label: 'Moyen', description: 'Il gagne et il bloque' },
        // Annoncé franchement : le morpion parfaitement joué est un match nul, et
        // déguiser « imbattable » en « fort » ferait chercher longtemps une faille.
        { value: 'difficile', icon: '🤖', label: 'Difficile', description: 'Il ne perd jamais' },
        { value: 'deux', icon: '👥', label: 'À deux', description: 'Sur le même écran' },
      ],
    },
  ],
  child: { Game: MorpionGame },
  adminTabs: [],
  adminRoutes: [],
};
