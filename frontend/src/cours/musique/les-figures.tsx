import Portee from 'src/musique/Portee';
import Paires from '../components/Paires';
import type { GrandeNotion } from '../cours.types';

/**
 * Les figures et les silences : combien de temps dure ce qu'on voit.
 *
 * Vient APRÈS la portée, et pas avant : on regarde d'abord où se pose une note, ensuite
 * combien de temps elle dure. Sa méthode sépare d'ailleurs strictement les deux, et c'est
 * l'objet de la dernière fiche de la notion suivante.
 *
 * Les syllabes Taé et Aé sont relevées sur son cahier, leçons 1 et 2. Elles changent d'une
 * méthode à l'autre : en écrire d'autres travaillerait contre sa professeure.
 */

const ENTRAINEMENT = { moduleId: 'solfege', label: 'Solfège' };

/** Une ligne de rythme, comme dans son cahier : une seule ligne, aucune hauteur. */
const rythme = (
  suite: {
    figure: 'ronde' | 'blanche' | 'noire' | 'croche';
    silence?: boolean;
    syllabe?: string;
  }[],
  barres: number[] = [],
) => (
  <Portee
    cle="rythme"
    espace={42}
    barres={barres}
    symboles={suite.map((s) => ({ position: 4, ...s }))}
  />
);

export const lesFigures: GrandeNotion = {
  slug: 'les-figures',
  titre: 'Les figures et les silences',
  resume:
    "Combien de temps dure une note, comment ça se lit sur le dessin, et pourquoi un silence n'est pas un trou.",

  concepts: [
    {
      slug: 'les-figures',
      titre: 'Les figures',
      entrainement: ENTRAINEMENT,
      fiche: {
        titre: 'Les figures',
        idee: "La durée d'une note se lit à son DESSIN, et à rien d'autre. Trois choses à regarder : la tête est-elle pleine ou vide, y a-t-il une queue, y a-t-il des crochets. La hauteur sur la portée ne dit rien de la durée, et la durée ne dit rien de la hauteur.",
        regle: [
          'Tête vide, sans queue : une ronde, 4 temps.',
          'Tête vide, avec queue : une blanche, 2 temps.',
          'Tête pleine, avec queue : une noire, 1 temps.',
          'Chaque crochet ajouté coupe la durée en deux : la croche vaut un demi-temps.',
        ],
        exemple: rythme([
          { figure: 'ronde' },
          { figure: 'blanche' },
          { figure: 'noire' },
          { figure: 'croche' },
        ]),
        piege:
          "La queue vers le haut ou vers le bas ne change RIEN à la durée. Elle monte quand la note est basse et descend quand la note est haute, pour que la figure tienne dans la page. C'est une règle d'écriture, pas de musique.",
      },
    },
    {
      slug: 'les-silences',
      titre: 'Les silences',
      entrainement: ENTRAINEMENT,
      fiche: {
        titre: 'Les silences',
        idee: "Chaque durée existe en deux versions : une qui sonne, une qui se tait. C'est tout le système, et c'est ce qui échappe le plus longtemps. Un soupir n'est pas une note bizarre : c'est le silence qui dure exactement ce que dure une noire. Un silence occupe son temps, il ne le supprime pas.",
        exemple: (
          <Paires
            colonnes={['ça sonne', 'ça se tait']}
            lignes={[
              ['ronde, 4 temps', 'pause'],
              ['blanche, 2 temps', 'demi-pause'],
              ['noire, 1 temps', 'soupir'],
              ['croche, un demi-temps', 'demi-soupir'],
            ]}
          />
        ),
        piege:
          "La pause et la demi-pause sont le même petit rectangle. Seule la ligne à laquelle il s'accroche les distingue : la pause PEND sous la quatrième ligne, la demi-pause est POSÉE sur la troisième. C'est la confusion la plus courante, et elle ne se règle qu'en les voyant côte à côte.",
      },
    },
    {
      slug: 'tae-et-ae',
      titre: 'Taé et Aé',
      entrainement: ENTRAINEMENT,
      fiche: {
        titre: 'Taé et Aé',
        idee: 'Sa méthode fait dire le rythme à voix haute avant de le jouer, avec des syllabes. Le point à comprendre : il y a une syllabe PAR TEMPS, et non par note. Une blanche dure deux temps, elle dit donc deux syllabes.',
        regle: [
          'Taé : un temps qui attaque, une note qui commence.',
          'aé : un temps qui prolonge le temps précédent.',
          'Aé : un temps qui se tait.',
          'Une blanche dit Taéaé. Un soupir dit Aé.',
        ],
        exemple: rythme(
          [
            { figure: 'noire', syllabe: 'Taé' },
            { figure: 'noire', silence: true, syllabe: 'Aé' },
            { figure: 'noire', syllabe: 'Taé' },
            { figure: 'blanche', syllabe: 'Taéaé' },
          ],
          [1],
        ),
        piege:
          "Compter les syllabes revient à compter les temps, et c'est exactement le but. Si une mesure à deux temps en dit trois, quelque chose est faux dans la lecture, pas dans la mesure.",
      },
    },
  ],
};
