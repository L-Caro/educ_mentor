import type { GrandeNotion } from '../cours.types';
import Paires from '../components/Paires';
import Phrases from '../components/Phrases';

/**
 * Le vivant, au CE1.
 *
 * Une seule fiche, et le corpus n'en a qu'une : les régimes alimentaires et la chaîne
 * alimentaire. Les deux se tiennent, d'où une fiche plutôt que deux.
 */

export const vivant: GrandeNotion = {
  slug: 'le-vivant',
  titre: 'Le vivant',
  resume: 'Qui mange quoi, et comment ça relie tous les êtres vivants entre eux.',

  concepts: [
    {
      slug: 'qui-mange-quoi',
      titre: 'Qui mange quoi',
      source: 'ce1.questionner-le-monde.les-interactions-entre-les-etres-vivants',
      fiche: {
        titre: 'Qui mange quoi',
        idee: "Tous les êtres vivants doivent se nourrir pour survivre. On les classe selon ce qu'ils mangent, et ce classement suffit à expliquer comment ils dépendent les uns des autres.",
        regle: [
          'Herbivore : il ne mange que des plantes.',
          'Carnivore : il ne mange que de la viande.',
          'Omnivore : il mange de tout.',
        ],
        // Deux figures empilées : chacune occupe un nombre entier d'interlignes, donc
        // leur somme aussi, et la réglure tient.
        exemple: (
          <>
            <Paires
              colonnes={['animal', 'son régime']}
              lignes={[
                ['la vache', 'herbivore'],
                ['le loup', 'carnivore'],
                ["l'ours", 'omnivore'],
              ]}
            />
            <Phrases lignes={["l'herbe → [le lapin] → [le renard]"]} />
          </>
        ),
        piege:
          "Une chaîne alimentaire commence toujours par une plante, parce qu'elle est la seule à se nourrir sans manger personne.",
      },
    },
  ],
};
