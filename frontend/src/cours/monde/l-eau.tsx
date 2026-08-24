import type { GrandeNotion } from '../cours.types';
import Paires from '../components/Paires';
import Phrases from '../components/Phrases';

/**
 * L'eau, au CE1.
 *
 * Deux fiches : ce qu'on observe (deux états), puis ce qui fait passer de l'un à l'autre.
 * L'ordre compte, parce que le vocabulaire savant (solidification, fusion) ne veut rien
 * dire tant qu'on n'a pas nommé les deux états qu'il relie.
 */

export const eau: GrandeNotion = {
  slug: 'l-eau',
  titre: "L'eau",
  resume: "L'eau liquide et l'eau solide, et ce qui fait passer de l'une à l'autre.",

  concepts: [
    {
      slug: 'liquide-et-solide',
      titre: "L'eau liquide et l'eau solide",
      source: 'ce1.questionner-le-monde.l-eau-a-l-etat-solide-et-a-l-etat-liquide',
      fiche: {
        titre: "L'eau liquide et l'eau solide",
        idee: "L'eau est la même substance sous deux apparences très différentes. Liquide, elle coule et prend la forme de son récipient. Solide, c'est de la glace : elle garde sa forme et on peut la tenir dans la main.",
        regle: [
          "Liquide, elle coule et n'a pas de forme à elle.",
          "Solide, elle a une forme et on peut l'attraper.",
          'Le passage se fait à 0 °C.',
        ],
        exemple: (
          <Paires
            colonnes={['liquide', 'solide']}
            lignes={[
              ['elle coule', 'elle garde sa forme'],
              ["on ne peut pas l'attraper", 'on peut la tenir'],
              ['au-dessus de 0 °C', 'en dessous de 0 °C'],
            ]}
          />
        ),
        piege:
          "C'est la même eau dans les deux cas. Un glaçon n'est pas une autre matière que l'eau du verre : c'est la même, plus froide.",
      },
    },

    {
      slug: 'changements-d-etat',
      titre: "Les changements d'état",
      source: 'ce1.questionner-le-monde.les-changements-d-etat-de-l-eau',
      fiche: {
        titre: "Les changements d'état",
        idee: "Passer d'un état à l'autre s'appelle un changement d'état, et c'est la température qui le commande. En dessous de 0 °C l'eau gèle, au-dessus elle fond. Ces deux passages ont un nom qu'on demande de connaître.",
        regle: [
          'La solidification : le liquide devient solide, sous 0 °C.',
          'La fusion : le solide devient liquide, au-dessus de 0 °C.',
          "C'est toujours la température qui décide.",
        ],
        exemple: (
          <Phrases
            lignes={[
              'eau liquide → [solidification] → glace',
              'glace → [fusion] → eau liquide',
            ]}
          />
        ),
        piege:
          "En gelant, l'eau prend plus de place mais ne devient pas plus lourde. La masse ne change pas, seul le volume augmente : c'est pour ça qu'une bouteille pleine oubliée au congélateur éclate.",
      },
    },
  ],
};
