import type { GrandeNotion } from '../cours.types';
import Paires from '../components/Paires';

/**
 * La conjugaison, au CE1.
 *
 * Une seule fiche, et c'est voulu : la tuile Conjugaison produit déjà une fiche par verbe
 * et par temps, à la volée. Ce qu'elle ne dit pas, parce qu'elle traite un cas à la fois,
 * c'est le principe général : POURQUOI un verbe change. C'est ce qui manque ici, le reste
 * est dans la tuile.
 */

export const laConjugaison: GrandeNotion = {
  slug: 'la-conjugaison',
  titre: 'La conjugaison',
  resume: 'Pourquoi un verbe change de forme. Le détail, verbe par verbe, est dans la tuile.',

  concepts: [
    {
      slug: 'le-verbe-se-conjugue',
      titre: 'Le verbe se conjugue',
      source: 'ce1.francais.la-conjugaison-du-verbe',
      entrainement: { moduleId: 'conjugaison', label: 'Conjugaison' },
      fiche: {
        titre: 'Le verbe se conjugue',
        idee: "Un verbe change de forme selon deux choses : QUI fait l'action, et QUAND elle se passe. On dit qu'il se conjugue. Le plus souvent, seule la fin du mot change, et cette fin s'appelle la terminaison.",
        regle: [
          'Il change avec le sujet : je chante, nous chantons.',
          'Il change avec le temps : hier je chantais, demain je chanterai.',
          "Quand il n'est pas conjugué, il est à l'infinitif : chanter.",
        ],
        exemple: (
          <Paires
            colonnes={['sujet', 'chanter au présent']}
            lignes={[
              ['je', 'chant{e}'],
              ['tu', 'chant{es}'],
              ['il, elle', 'chant{e}'],
              ['nous', 'chant{ons}'],
              ['vous', 'chant{ez}'],
              ['ils, elles', 'chant{ent}'],
            ]}
          />
        ),
        piege:
          "Trois formes se prononcent pareil : je chante, tu chantes, ils chantent. Seule l'écriture les distingue, et c'est le sujet qui décide laquelle écrire.",
      },
    },
  ],
};
