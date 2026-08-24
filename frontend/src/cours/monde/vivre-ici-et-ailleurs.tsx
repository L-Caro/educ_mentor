import type { GrandeNotion } from '../cours.types';
import Paires from '../components/Paires';

/**
 * Vivre ici et ailleurs, au CE1.
 *
 * Trois fiches qui vont du plus proche au plus lointain : les paysages qu'on traverse en
 * France, la façon dont on y vit selon l'endroit, puis les autres pays. C'est le seul
 * ordre qui tienne à cet âge : on ne comprend « ailleurs » qu'à partir d'« ici ».
 *
 * Le fil des trois : ce n'est pas le hasard qui décide comment on vit, c'est le lieu. Le
 * climat, le relief, ce qui pousse.
 */

export const vivreIciEtAilleurs: GrandeNotion = {
  slug: 'vivre-ici-et-ailleurs',
  titre: 'Vivre ici et ailleurs',
  resume: "Les paysages de France, comment on y vit, et comment on vit dans d'autres pays.",

  concepts: [
    {
      slug: 'paysages-de-france',
      titre: 'Les paysages en France',
      source: 'ce1.questionner-le-monde.les-differents-paysages-en-france',
      entrainement: { moduleId: 'france', label: 'La France' },
      fiche: {
        titre: 'Les paysages en France',
        idee: "On distingue quatre grands types de paysages en France. Ce ne sont pas des décors : chacun vient du relief et du climat de l'endroit, et c'est lui qui décide de ce qu'on y trouve.",
        regle: [
          'Rural : la campagne, les champs, les villages.',
          'Urbain : la ville, les immeubles, les commerces.',
          'Montagnard : les vallées et les sommets.',
          'Littoral : la limite entre la terre et la mer.',
        ],
        exemple: (
          <Paires
            colonnes={['paysage', "ce qu'on y voit"]}
            lignes={[
              ['rural', 'des champs, des prairies'],
              ['urbain', 'des immeubles, des usines'],
              ['montagnard', 'des vallées, des forêts'],
              ['littoral', 'des plages, des ports'],
            ]}
          />
        ),
        piege:
          "Un même endroit peut relever de deux paysages. Une ville au bord de la mer est urbaine ET littorale : ce sont des façons de regarder, pas des cases.",
      },
    },

    {
      slug: 'modes-de-vie-en-france',
      titre: 'Les modes de vie en France',
      source: 'ce1.questionner-le-monde.les-modes-de-vie-en-france',
      entrainement: { moduleId: 'france', label: 'La France' },
      fiche: {
        titre: 'Les modes de vie en France',
        idee: "On ne vit pas de la même façon partout en France, et ce n'est pas une question de goût : c'est le lieu qui impose. La place disponible décide de la maison, le climat décide des vêtements et des loisirs.",
        regle: [
          'En ville : des immeubles, beaucoup de monde, peu de jardins.',
          'À la campagne : des maisons individuelles, groupées en villages.',
          'À la montagne : des maisons faites pour la neige et le froid.',
        ],
        exemple: (
          <Paires
            colonnes={["où l'on vit", 'la maison']}
            lignes={[
              ['en ville', 'un immeuble'],
              ['à la campagne', 'une maison avec du terrain'],
              ['à la montagne', 'une maison bâtie pour la neige'],
            ]}
          />
        ),
        piege:
          "Le climat ne change pas qu'entre les pays : entre le nord et le sud de la France, les températures et donc les habitudes ne sont pas les mêmes.",
      },
    },

    {
      slug: 'modes-de-vie-dans-le-monde',
      titre: 'Les modes de vie dans le monde',
      source: 'ce1.questionner-le-monde.les-differents-modes-de-vie-dans-le-monde',
      entrainement: { moduleId: 'geo', label: 'Géographie' },
      fiche: {
        titre: 'Les modes de vie dans le monde',
        idee: "Partout, les êtres humains s'adaptent à ce qu'ils ont autour d'eux : le climat, ce qui pousse, ce qu'on peut construire. C'est pour ça qu'on ne se loge pas, ne mange pas et ne s'habille pas pareil d'un pays à l'autre.",
        regle: [
          "Près du pôle Nord, on n'a que la neige : on bâtit des igloos.",
          'On mange ce que la terre du pays donne.',
          "On s'habille selon le climat et les coutumes.",
        ],
        exemple: (
          <Paires
            colonnes={['pays', "ce qui s'y porte"]}
            lignes={[
              ['le Japon', 'le kimono'],
              ['le Pérou', 'le poncho de laine'],
              ['les États-Unis', 'on y joue au baseball'],
              ['le Canada', 'on y joue au hockey'],
            ]}
          />
        ),
        piege:
          "Une différence n'est pas une bizarrerie. Manger avec des baguettes ou avec les mains est aussi normal, là-bas, que la fourchette ici.",
      },
    },
  ],
};
