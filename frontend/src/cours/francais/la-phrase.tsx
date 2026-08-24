import type { GrandeNotion } from '../cours.types';
import Paires from '../components/Paires';
import Phrases from '../components/Phrases';

/**
 * La phrase, au CE1.
 *
 * Trois fiches, alors que le corpus en a quatre : il isole la phrase exclamative des
 * trois autres types, ce qui n'a pas de sens ici. Les quatre types se comprennent
 * ensemble, par ce qui les distingue ; séparés, ils deviennent quatre définitions à
 * retenir au lieu d'une seule opposition à voir.
 */

export const laPhrase: GrandeNotion = {
  slug: 'la-phrase',
  titre: 'La phrase',
  resume: "Ce qui fait qu'une phrase en est une, la ponctuation, et les quatre types de phrases.",

  concepts: [
    {
      slug: 'la-phrase',
      titre: 'La phrase',
      source: 'ce1.francais.la-phrase',
      fiche: {
        titre: 'La phrase',
        idee: "Une phrase est une suite de mots qui veut dire quelque chose. Elle commence par une majuscule et se termine par un point. Sans ces deux marques, ce n'est pas une phrase, c'est un morceau de phrase.",
        regle: [
          'Une majuscule au début.',
          'Un point à la fin.',
          'Et entre les deux, ça doit vouloir dire quelque chose.',
        ],
        exemple: (
          <Paires
            colonnes={['une phrase', 'pas une phrase']}
            lignes={[
              ['Le chat dort.', 'le chat dort'],
              ['Il pleut ce matin.', 'pleut ce matin il'],
            ]}
          />
        ),
        piege:
          'Une phrase peut être très courte. « Il pleut. » en est une : deux mots, une majuscule, un point.',
      },
    },

    {
      slug: 'la-ponctuation',
      titre: 'La ponctuation',
      source: 'ce1.francais.la-ponctuation',
      fiche: {
        titre: 'La ponctuation',
        idee: "Les signes de ponctuation ne sont pas des décorations : ils disent comment lire. Un point arrête, une virgule fait respirer, un point d'interrogation lève la voix. Enlever la ponctuation d'un texte le rend illisible bien avant de le rendre faux.",
        regle: [
          'Le point : la phrase est finie.',
          "Le point d'interrogation : on pose une question.",
          "Le point d'exclamation : on montre une émotion.",
          'La virgule : une courte pause au milieu.',
        ],
        exemple: (
          <Phrases
            lignes={[
              'Le chat dort[.]',
              'Où est le chat [?]',
              'Quel beau chat [!]',
              'Le chat[,] fatigué[,] dort.',
            ]}
          />
        ),
        piege:
          "La virgule ne finit jamais une phrase. Elle sépare à l'intérieur, elle n'arrête rien.",
      },
    },

    {
      slug: 'types-de-phrases',
      titre: 'Les types de phrases',
      source: 'ce1.francais.les-phrases-declarative-interrogative-et-imperative',
      fiche: {
        titre: 'Les types de phrases',
        idee: "Une phrase ne sert pas toujours à la même chose : elle peut raconter, demander, ordonner, ou s'exclamer. Le signe de la fin annonce laquelle c'est, souvent avant même qu'on l'ait lue en entier.",
        regle: [
          'Déclarative : elle donne une information.',
          'Interrogative : elle pose une question.',
          'Impérative : elle donne un ordre ou un conseil.',
          'Exclamative : elle montre une émotion.',
        ],
        exemple: (
          <Paires
            colonnes={['la phrase', "ce qu'elle fait"]}
            lignes={[
              ['Le chat dort.', 'elle raconte'],
              ['Où est le chat ?', 'elle demande'],
              ['Ferme la porte.', 'elle ordonne'],
              ['Quel beau chat !', "elle s'exclame"],
            ]}
          />
        ),
        piege:
          "La phrase impérative n'a pas de sujet écrit : « Ferme la porte. » On ne dit pas qui doit fermer, c'est celui à qui on parle.",
      },
    },
  ],
};
