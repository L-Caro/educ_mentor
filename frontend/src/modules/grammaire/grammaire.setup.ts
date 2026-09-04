import type { SetupOption } from 'src/types/game.types';

/** Une seule option propre au module, comme en géométrie : l'étape difficulté commune est
 * conservée (pas de `skipDifficulty`), et c'est elle qui porte la complexité des phrases.
 *
 * Pas d'option « notion à travailler » comme en dictée : là-bas les notions sont
 * orthographiques, donc orthogonales au niveau. Ici, le type d'exercice EST la notion. */
export const GRAMMAIRE_SETUP_OPTIONS: SetupOption[] = [
  {
    key: 'questionTypes',
    type: 'multi',
    label: 'Quoi travailler ?',
    choices: [
      {
        value: 'nature_mot',
        icon: '🏷️',
        label: 'La nature',
        description: 'Un mot souligné : nom, verbe, déterminant ?',
      },
      {
        value: 'trouver_mots',
        icon: '👆',
        label: 'Trouver les mots',
        description: 'Toucher les noms, le verbe, les adjectifs',
      },
      {
        value: 'trouver_fonction',
        icon: '🎯',
        label: 'Sujet et compléments',
        description: "Qui fait l'action ? où, quand, comment ?",
      },
      {
        value: 'groupe_nominal',
        icon: '🧩',
        label: 'Le groupe nominal',
        description: 'Le nom et tout ce qui va avec',
      },
    ],
  },
];
