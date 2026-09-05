import type { ModuleManifest } from 'src/types/modules.types';
import MorpionGame from './MorpionGame';

export const morpionModule: ModuleManifest = {
  id: 'morpion',
  category: 'jeux',
  setupOptions: [
    // La règle d'abord : elle change le jeu, alors que l'adversaire ne change que sa
    // force. Poser la petite question avant la grande ferait revenir en arrière.
    {
      key: 'variante',
      type: 'single',
      label: 'Quelle règle ?',
      choices: [
        {
          value: 'classique',
          icon: '⊞',
          label: 'Classique',
          description: 'Neuf cases à remplir',
        },
        // La grille ne se remplit jamais : la partie ne s'éteint plus en match nul au
        // neuvième coup, il faut voir ce que l'autre prépare.
        {
          value: 'trois',
          icon: '♟',
          label: 'À trois pions',
          description: 'Trois pions chacun, puis on les déplace',
        },
      ],
    },
    {
      key: 'adversaire',
      type: 'single',
      label: 'Contre qui ?',
      choices: [
        { value: 'facile', icon: '🙂', label: 'Facile', description: 'Il joue au hasard' },
        { value: 'moyen', icon: '🤔', label: 'Moyen', description: 'Il gagne et il bloque' },
        // Annoncé franchement : le morpion parfaitement joué est un match nul — les DEUX
        // règles, la variante à trois pions l'est aussi (résolue dans `troisPions.ts`).
        // Déguiser « imbattable » en « fort » ferait chercher longtemps une faille.
        { value: 'difficile', icon: '🤖', label: 'Difficile', description: 'Il ne perd jamais' },
        { value: 'deux', icon: '👥', label: 'À deux', description: 'Sur le même écran' },
      ],
    },
  ],
  child: { Game: MorpionGame },
  adminTabs: [],
  adminRoutes: [],
};
