import type { ModuleManifest } from 'src/types/modules.types';
import AlphabetGame from './AlphabetGame';
import { alphabetImpression } from './alphabet.impression';

/**
 * Ranger des mots dans l'ordre alphabetique.
 *
 * `skipDifficulty` : facile/normal/difficile ne veut rien dire ici. Ce qui fait la
 * difficulte, c'est le nombre de LETTRES COMMUNES entre les mots a comparer : ranger
 * `banane` et `tortue` demande de connaitre l'alphabet, ranger `chaton` et `chatte`
 * demande de le parcourir jusqu'a la cinquieme lettre. C'est le meme exercice a deux
 * ans d'ecart, et cela merite sa propre question.
 *
 * Le reglage est un PLAFOND. « Jusqu'a la cinquieme lettre » ne veut pas dire que tous
 * les mots se ressemblent sur quatre lettres, mais qu'aucune paire n'en partage plus, et
 * qu'une au moins y arrive. Le reste de la liste se separe plus tot, comme dans un vrai
 * dictionnaire.
 */
export const alphabetModule: ModuleManifest = {
  id: 'alphabet',
  category: 'francais',
  skipDifficulty: true,
  setupOptions: [
    {
      key: 'communes',
      type: 'single',
      label: 'Au plus loin, les mots se ressemblent jusqu’à',
      choices: [
        {
          value: '0',
          label: 'La 1re lettre',
          description: 'banane, lapin, tortue',
        },
        {
          value: '1',
          label: 'La 2e lettre',
          description: 'chat, cheval, lapin',
        },
        {
          value: '2',
          label: 'La 3e lettre',
          description: 'chat, chemin, lapin',
        },
        {
          value: '3',
          label: 'La 4e lettre',
          description: 'chaton, chaque, cheval, lapin',
        },
        {
          value: '4',
          label: 'La 5e lettre',
          description: 'chatte, chaton, chemin, lapin',
        },
      ],
    },
    {
      key: 'types',
      type: 'multi',
      label: 'Ce qu’il faut faire',
      choices: [
        { value: 'ranger', label: 'Ranger les mots' },
        { value: 'intrus', label: 'Trouver le mot mal placé' },
        { value: 'intercaler', label: 'Glisser un mot au bon endroit' },
      ],
    },
    {
      key: 'combien',
      type: 'single',
      label: 'Combien de mots à la fois',
      choices: [
        { value: '4', label: '4 mots' },
        { value: '8', label: '8 mots' },
        { value: '10', label: '10 mots' },
        { value: '12', label: '12 mots' },
        { value: '15', label: '15 mots' },
        { value: '20', label: '20 mots' },
      ],
    },
  ],
  child: { Game: AlphabetGame },
  adminTabs: [],
  adminRoutes: [],
  impression: alphabetImpression,
};
