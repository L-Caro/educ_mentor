import type { GrandeNotion } from '../cours.types';
import DroiteGraduee from '../components/DroiteGraduee';
import Paires from '../components/Paires';

/**
 * Le temps, au CE1.
 *
 * Deux fiches : l'outil qui sert à ranger le temps (la frise), puis un exemple concret de
 * ce qu'on y range (comment vivaient les grands-parents). L'outil d'abord, parce que sans
 * lui « avant » et « après » restent des mots.
 *
 * La frise réutilise `DroiteGraduee` : une frise chronologique EST une droite graduée, et
 * s'en apercevoir vaut mieux que redessiner la même chose.
 */

export const temps: GrandeNotion = {
  slug: 'le-temps',
  titre: 'Le temps',
  resume: 'La frise chronologique pour ranger le temps, et ce que le temps change.',

  concepts: [
    {
      slug: 'la-frise',
      titre: 'La frise chronologique',
      source: 'ce1.questionner-le-monde.la-representation-des-evenements-dans-le-temps',
      fiche: {
        titre: 'La frise chronologique',
        idee: "Une frise chronologique range les événements dans l'ordre où ils se sont passés. Elle se lit de gauche à droite : à gauche le plus ancien, à droite le plus récent, et la flèche du bout dit que le temps continue.",
        regle: [
          'Je lis de la gauche vers la droite.',
          "Je regarde l'écart entre deux graduations : c'est l'échelle.",
          'Je place ma date en fonction de cet écart.',
        ],
        exemple: (
          <DroiteGraduee graduations={[1900, 1920, 1940, 1960, 1980, 2000]} marque={1969} />
        ),
        piege:
          "Une date peut tomber entre deux graduations, et c'est normal : la frise ne montre pas toutes les années, seulement des repères réguliers.",
      },
    },

    {
      slug: 'modes-de-vie-autrefois',
      titre: 'Comment on vivait avant',
      source: 'ce1.questionner-le-monde.l-evolution-des-modes-de-vie-de-ma-famille',
      fiche: {
        titre: 'Comment on vivait avant',
        idee: "Les objets du quotidien racontent une époque. En regardant comment écrivaient, s'habillaient et apprenaient nos grands-parents, on voit ce qui a changé et ce qui n'a pas changé du tout.",
        regle: [
          'On écrivait à la plume, avec un encrier.',
          'On portait une blouse sombre en classe.',
          "Les filles et les garçons n'étaient pas dans la même école.",
        ],
        exemple: (
          <Paires
            colonnes={['autrefois', "aujourd'hui"]}
            lignes={[
              ["la plume et l'encrier", 'le stylo'],
              ['la blouse en classe', 'ses propres habits'],
              ['filles et garçons séparés', 'tout le monde ensemble'],
            ]}
          />
        ),
        piege:
          "Autrefois, très peu d'élèves continuaient l'école après l'élémentaire. Ce n'est pas qu'ils travaillaient moins : c'est que l'école s'arrêtait là pour presque tous.",
      },
    },
  ],
};
