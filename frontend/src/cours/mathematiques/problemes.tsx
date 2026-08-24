import type { GrandeNotion } from '../cours.types';
import Paires from '../components/Paires';
import Phrases from '../components/Phrases';

/**
 * Résoudre un problème, au CE1.
 *
 * Deux fiches, alors que le découpage initial en annonçait six. Le corpus consacre bien
 * une leçon par grandeur (monnaie, longueurs, masses, contenances, durées), mais ces cinq
 * leçons ne contiennent RIEN d'autre que « on peut résoudre un problème avec X » : tout
 * leur contenu est dans des images d'exemples résolus. Les décliner ici aurait produit
 * cinq fiches creuses qui disent la même chose.
 *
 * Ce qui reste, et qui est le vrai sujet : la méthode, et le choix de l'opération. La
 * grandeur du problème ne change ni l'une ni l'autre.
 */

export const problemes: GrandeNotion = {
  slug: 'resoudre-un-probleme',
  titre: 'Résoudre un problème',
  resume:
    "La méthode en quatre étapes, et le choix de l'opération. La grandeur du problème n'y change rien.",

  concepts: [
    {
      slug: 'la-methode',
      titre: 'La méthode',
      source: 'ce1.mathematiques.la-resolution-de-probleme',
      fiche: {
        titre: 'Résoudre un problème',
        idee: "Un problème se résout dans un ordre, et la plupart des erreurs viennent d'une étape sautée. La plus souvent sautée est la première : commencer à calculer avant d'avoir compris ce qu'on cherche.",
        regle: [
          "Je lis l'énoncé, et je fais un dessin si besoin.",
          "Je repère ce qu'on me demande de trouver.",
          "Je choisis l'opération, et je calcule.",
          "J'écris une phrase qui répond à la question.",
        ],
        exemple: (
          <Phrases
            lignes={[
              'Léa a 12 billes. Elle en perd 5.',
              'Question : [combien lui en reste-t-il ?]',
              '12 − 5 = 7',
              'Il lui reste 7 billes.',
            ]}
          />
        ),
        piege:
          "Un énoncé contient souvent un nombre qui ne sert à rien. Ce n'est pas parce qu'un nombre est écrit qu'il entre dans le calcul.",
      },
    },

    {
      slug: 'choisir-l-operation',
      titre: 'Choisir la bonne opération',
      source: 'ce1.mathematiques.la-resolution-de-probleme',
      fiche: {
        titre: 'Choisir la bonne opération',
        idee: "C'est l'étape qui bloque le plus souvent. Il n'y a pas de mot magique dans l'énoncé : c'est ce qui ARRIVE aux quantités qui décide. On ajoute, on retire, on répète, ou on partage.",
        regle: [
          "On met ensemble, on ajoute : c'est une addition.",
          'On retire, on cherche un reste ou ce qui manque : soustraction.',
          'On répète la même quantité : multiplication.',
          'On distribue en parts égales : partage.',
        ],
        exemple: (
          <Paires
            colonnes={['ce qui se passe', 'opération']}
            lignes={[
              ['elle reçoit 5 billes de plus', '+'],
              ['elle en perd 5', '−'],
              ['4 sachets de 6 billes', '×'],
              ['24 billes pour 4 enfants', 'partage'],
            ]}
          />
        ),
        piege:
          "« De plus » n'annonce pas toujours une addition. « Léa a 5 billes de plus que Tom, qui en a 12 » se résout par une addition, mais « Léa a 12 billes, 5 de plus que Tom » par une soustraction.",
      },
    },
  ],
};
