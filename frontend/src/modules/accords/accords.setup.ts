import type { SetupOption } from 'src/types/game.types';

/** Une seule option propre au module, comme en géométrie et en grammaire : l'étape
 * difficulté commune est conservée, et c'est elle qui porte la morphologie — pluriels
 * réguliers seuls en facile, irréguliers et deux adjectifs en difficile.
 *
 * Les cinq choix sont les cinq fiches de `cours/francais/accords.tsx`, dans leur ordre,
 * qui est pédagogique : de quoi un nom est marqué, puis comment les autres mots suivent. */
export const ACCORDS_SETUP_OPTIONS: SetupOption[] = [
  {
    key: 'questionTypes',
    type: 'multi',
    label: 'Quoi travailler ?',
    choices: [
      {
        value: 'genre_nom',
        icon: '⚥',
        label: 'Le genre',
        description: 'Masculin ou féminin : un ou une ?',
      },
      {
        value: 'nombre_nom',
        icon: '🔢',
        label: 'Le nombre',
        description: 'Écrire un nom au pluriel, ou au singulier',
      },
      {
        value: 'accord_adjectif',
        icon: '🎨',
        label: "L'adjectif",
        description: "L'adjectif prend le genre et le nombre du nom",
      },
      {
        value: 'accord_gn',
        icon: '🧩',
        label: 'Le groupe nominal',
        description: 'Tout accorder dans le groupe, du début à la fin',
      },
      {
        value: 'accord_sujet_verbe',
        icon: '🔗',
        label: 'Sujet et verbe',
        description: 'Un seul ou plusieurs ? Le verbe suit',
      },
    ],
  },
];
