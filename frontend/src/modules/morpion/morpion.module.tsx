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
    // Le module déclare SA clé `difficulty`, et c'est ce qui compte : sans elle, le
    // pré-jeu injecte la sienne, « 2 choix / 4 choix / Saisie libre », qui ne veut rien
    // dire sur un plateau. Le jeu posait alors deux fois la même question, une fois sous
    // son nom et une fois sous celui du moteur.
    //
    // « À deux » n'est plus ici : c'est un bouton sur le plateau. Ce n'est pas un niveau
    // de difficulté, et l'enterrer dans cette liste obligeait à ressortir du jeu pour
    // passer la main à quelqu'un.
    {
      key: 'difficulty',
      type: 'single',
      label: 'Quel niveau ?',
      choices: [
        { value: 'easy', icon: '🙂', label: 'Facile', description: 'Il joue au hasard' },
        { value: 'medium', icon: '🤔', label: 'Moyen', description: 'Il gagne et il bloque' },
        // Annoncé franchement : le morpion parfaitement joué est un match nul, les DEUX
        // règles, la variante à trois pions l'est aussi (résolue dans `troisPions.ts`).
        // Déguiser « imbattable » en « fort » ferait chercher longtemps une faille.
        { value: 'hard', icon: '🤖', label: 'Difficile', description: 'Il ne perd jamais' },
      ],
    },
  ],
  child: { Game: MorpionGame },
  adminTabs: [],
  adminRoutes: [],
};
