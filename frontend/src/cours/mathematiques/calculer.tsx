import type { GrandeNotion } from '../cours.types';
import type { PoseQuestion } from 'src/modules/pose/pose.type';
import PoseFigure from 'src/modules/pose/PoseFigure';
import TableRappel from 'src/modules/tables/TableRappel';
import Etapes from '../components/Etapes';

/**
 * Calculer, au CE1.
 *
 * Dix concepts réécrits à partir du corpus (les leçons source sont notées sur chaque
 * fiche). Ce n'est pas une reformulation : 75 % des exemples du corpus sont cuits dans
 * des images, et les fiches Kartable expliquent BEAUCOUP en supposant l'adulte présent.
 * Ici chaque fiche tient une seule idée, énonce le geste dans l'ordre où la main le fait,
 * et nomme l'erreur qu'on voit vraiment.
 *
 * L'ordre est celui de l'apprentissage, pas celui du corpus : les faits qu'on mémorise
 * (tables, compléments, doubles) viennent avant les techniques qui s'appuient dessus, et
 * le calcul en ligne avant le calcul posé.
 */

// ─── Figures ──────────────────────────────────────────────────────────────────

/** Une opération posée, pour la montrer sans la faire jouer.
 *  Les retenues sont écrites en dur ; `cours-calculer.test.ts` les recalcule et compare. */
function figure(over: Partial<PoseQuestion> & Pick<PoseQuestion, 'operands' | 'answer'>): PoseQuestion {
  return {
    skill_key: 'cours',
    operation: 'addition',
    answer_length: String(over.answer).length,
    columns: Math.max(...over.operands.map((n) => String(n).length)) + 1,
    has_carry: true,
    carry_display: 'filled',
    method: 'compensation',
    partiels: [],
    retenues: { haut: [], bas: [] },
    ...over,
  };
}

const ADDITION_POSEE = figure({
  operands: [268, 57],
  answer: 325,
  retenues: { haut: [null, 1, 1, null], bas: [null, null, null, null] },
});

const SOUSTRACTION_COMPENSATION = figure({
  operation: 'soustraction',
  operands: [264, 138],
  answer: 126,
  retenues: { haut: [14, null, null, null], bas: [null, 4, null, null] },
});

const SOUSTRACTION_CASSAGE = figure({
  operation: 'soustraction',
  method: 'cassage',
  operands: [264, 138],
  answer: 126,
  retenues: { haut: [14, 5, null, null], bas: [null, null, null, null] },
});

// ─── La notion ────────────────────────────────────────────────────────────────

export const calculer: GrandeNotion = {
  slug: 'calculer',
  titre: 'Calculer',
  resume:
    "Les résultats qu'on apprend par cœur, puis les techniques qui s'appuient dessus : en ligne, puis posé.",

  concepts: [
    {
      slug: 'tables-addition',
      titre: "Les tables d'addition",
      source: 'ce1.mathematiques.les-tables-d-addition',
      entrainement: { moduleId: 'calcul-mental', label: 'Calcul mental' },
      fiche: {
        titre: "Les tables d'addition",
        idee: "Les résultats des additions jusqu'à 10, on finit par les savoir sans les calculer. Les savoir par cœur ne sert pas seulement à aller vite : ça libère la tête pour la suite du calcul, qui est souvent la vraie difficulté.",
        regle: [
          'Sur la table, je cherche le premier nombre en haut.',
          'Je cherche le second dans la colonne de gauche.',
          'Le résultat est à leur croisement.',
        ],
        exemple: (
          <Etapes
            aligne="egal"
            lignes={['4 + 9 = 13', '5 + 8 = 13', '6 + 7 = 13', '7 + 6 = 13']}
          />
        ),
        piege:
          "Changer l'ordre des deux nombres ne change pas le résultat. C'est deux fois moins de choses à retenir qu'il n'y paraît.",
      },
    },

    {
      slug: 'complements',
      titre: 'Les compléments à la dizaine et à la centaine',
      source: 'ce1.mathematiques.les-complements-a-la-dizaine-et-a-la-centaine',
      entrainement: { moduleId: 'calcul-mental', label: 'Calcul mental' },
      fiche: {
        titre: 'Les compléments',
        idee: "Le complément, c'est ce qui manque pour arriver à un nombre rond. Il y a onze couples qui font 10, et il suffit de les tenir : tous les autres compléments s'en déduisent sans rien apprendre de plus.",
        regle: [
          'Je sais que 3 + 7 = 10.',
          'Alors 13 + 7 = 20, et 23 + 7 = 30.',
          'Le chiffre des unités ne bouge pas, seule la dizaine avance.',
        ],
        exemple: (
          <Etapes
            aligne="egal"
            lignes={['3 + 7 = 10', '13 + 7 = 20', '23 + 7 = 30', '33 + 7 = 40']}
          />
        ),
        piege:
          "Pour les centaines, c'est le même raisonnement mais avec des dizaines entières : 80 + 20 = 100, donc 180 + 20 = 200.",
      },
    },

    {
      slug: 'doubles-et-moities',
      titre: 'Les doubles et les moitiés',
      source: 'ce1.mathematiques.les-doubles-et-les-moities',
      entrainement: { moduleId: 'calcul-mental', label: 'Calcul mental' },
      fiche: {
        titre: 'Les doubles et les moitiés',
        idee: "Doubler, c'est prendre deux fois. Prendre la moitié, c'est partager en deux parts égales. C'est le même geste dans un sens puis dans l'autre : si le double de 8 est 16, alors la moitié de 16 est 8. On n'apprend donc qu'une seule liste.",
        regle: [
          "Le double de 8, c'est 8 + 8, donc 16.",
          "La moitié de 16, c'est le nombre qui, doublé, fait 16.",
          "C'est 8 : la même ligne, lue à l'envers.",
        ],
        exemple: (
          <Etapes
            aligne="egal"
            lignes={[
              'double de 6 = 12',
              'double de 7 = 14',
              'moitié de 12 = 6',
              'moitié de 14 = 7',
            ]}
          />
        ),
        piege:
          "Tous les nombres ont un double. Tous n'ont pas de moitié entière : il faut un nombre pair, c'est-à-dire qui se termine par 0, 2, 4, 6 ou 8.",
      },
    },

    {
      slug: 'addition-en-ligne',
      titre: "L'addition en ligne",
      source: 'ce1.mathematiques.l-addition-en-ligne-de-nombres-entiers',
      entrainement: { moduleId: 'calcul-mental', label: 'Calcul mental' },
      fiche: {
        titre: "L'addition en ligne",
        idee: "Additionner en ligne, c'est découper les nombres avant de les additionner : les dizaines avec les dizaines, les unités avec les unités. On remplace un calcul difficile par deux calculs faciles. Les nombres qu'on additionne s'appellent les termes, et le résultat s'appelle la somme.",
        regle: [
          "Je découpe : 37, c'est 30 et 7. Et 12, c'est 10 et 2.",
          "J'additionne les dizaines : 30 + 10 = 40.",
          "J'additionne les unités : 7 + 2 = 9.",
          'Je rassemble : 40 + 9 = 49.',
        ],
        exemple: (
          <Etapes
            aligne="egal"
            lignes={['37 + 12 = ?', '30 + 10 = 40', '7 + 2 = 9', '40 + 9 = 49']}
          />
        ),
        piege:
          "Les dizaines vont avec les dizaines, les unités avec les unités. 30 + 2 n'a rien à faire dans ce calcul.",
      },
    },

    {
      slug: 'addition-posee',
      titre: "L'addition posée",
      source: 'ce1.mathematiques.l-addition-posee-de-nombres-entiers',
      entrainement: { moduleId: 'pose', label: 'Calcul posé' },
      fiche: {
        titre: "L'addition posée",
        idee: "On pose une addition quand les nombres sont trop grands pour tenir en tête. Les ranger en colonnes, unités sous unités et dizaines sous dizaines, fait que chaque colonne se calcule ensuite toute seule. On part toujours de la droite.",
        regle: [
          "J'additionne la colonne des unités.",
          "Si le résultat dépasse 9, je n'écris que le chiffre des unités.",
          "Je reporte 1 au-dessus de la colonne de gauche : c'est la retenue.",
          'Je continue colonne par colonne, sans oublier la retenue.',
        ],
        exemple: <PoseFigure question={ADDITION_POSEE} />,
        piege:
          "La retenue s'écrit au-dessus de la colonne SUIVANTE, pas de celle qu'on vient de calculer.",
      },
    },

    {
      slug: 'soustraction-en-ligne',
      titre: 'La soustraction en ligne',
      source: 'ce1.mathematiques.la-soustraction-en-ligne-de-nombres-entiers',
      entrainement: { moduleId: 'calcul-mental', label: 'Calcul mental' },
      fiche: {
        titre: 'La soustraction en ligne',
        idee: "Pour retirer un nombre en ligne, on ne le retire pas d'un coup : on le découpe et on retire les morceaux l'un après l'autre. Retirer 70, puis retirer 9, est beaucoup plus simple que retirer 79. Le résultat s'appelle la différence.",
        regle: [
          "Je découpe le nombre à retirer : 79, c'est 70 et 9.",
          'Je retire les dizaines : 586 − 70 = 516.',
          'Je retire les unités : 516 − 9 = 507.',
        ],
        exemple: (
          <Etapes
            aligne="egal"
            lignes={['586 − 79 = ?', '586 − 70 = 516', '516 − 9 = 507']}
          />
        ),
        piege:
          "On découpe le nombre qu'on RETIRE, pas celui de départ. Découper les deux mène vite à une colonne où on ne peut plus rien retirer.",
      },
    },

    {
      slug: 'soustraction-posee',
      titre: 'La soustraction posée',
      source: 'ce1.mathematiques.la-soustraction-posee-de-nombres-entiers',
      entrainement: { moduleId: 'pose', label: 'Calcul posé' },
      // La seule fiche de la notion qui dépend d'un réglage. Les deux méthodes donnent le
      // même résultat mais ne s'écrivent pas pareil, et montrer au parent une méthode que
      // la maîtresse n'enseigne pas serait pire que ne rien montrer.
      fiche: (reglages) => {
        const cassage = reglages.pose_subtraction_method === 'cassage';
        return {
          titre: 'La soustraction posée',
          idee: `Poser une soustraction range les chiffres en colonnes et permet de traiter chaque colonne à part, en partant de la droite. Le moment délicat est toujours le même : le chiffre du haut est trop petit, on ne peut pas retirer, il faut aller chercher une dizaine ailleurs. La méthode réglée ici est ${cassage ? 'le cassage' : 'la compensation'}.`,
          regle: cassage
            ? [
                'Je ne peux pas retirer : le chiffre du haut est trop petit.',
                'Je barre son voisin de gauche et je le réécris diminué de 1.',
                "La dizaine empruntée s'ajoute à mon chiffre : 4 devient 14.",
                'Le nombre du haut se lit maintenant dans les chiffres réécrits.',
              ]
            : [
                'Je ne peux pas retirer : le chiffre du haut est trop petit.',
                "J'ajoute 10 à mon chiffre : 4 devient 14.",
                'Je rends cette dizaine au nombre du BAS, à la colonne de gauche.',
                'Je continue, sans oublier la dizaine ajoutée en bas.',
              ],
          exemple: (
            <PoseFigure question={cassage ? SOUSTRACTION_CASSAGE : SOUSTRACTION_COMPENSATION} />
          ),
          piege: cassage
            ? "Le voisin de gauche a prêté : il vaut 1 de moins. C'est ce chiffre barré qu'on oublie, et toute la fin du calcul est fausse."
            : "La dizaine se rend au nombre du BAS, jamais au résultat. La méthode se change dans les paramètres si ce n'est pas celle de la maîtresse.",
        };
      },
    },

    {
      slug: 'tables-multiplication',
      titre: 'Les tables de multiplication',
      source: 'ce1.mathematiques.les-tables-de-multiplication',
      entrainement: { moduleId: 'tables', label: 'Tables' },
      fiche: {
        titre: 'Les tables de multiplication',
        idee: "Multiplier, c'est additionner le même nombre plusieurs fois. 4 × 3, c'est 3 + 3 + 3 + 3. La table donne le résultat sans refaire l'addition, et c'est exactement à ça qu'elle sert. Le résultat s'appelle le produit.",
        regle: [
          '4 × 3 et 3 × 4 donnent le même résultat : 12.',
          'Il y a donc deux fois moins de résultats à retenir.',
          'Dans la table de 2, tous les résultats sont pairs.',
          'Dans la table de 5, tous se terminent par 0 ou par 5.',
        ],
        exemple: <TableRappel table={5} highlight={0} />,
        piege:
          'Multiplier par 10 ajoute un zéro : 37 × 10 = 370. Par 100, deux zéros. Ça ne marche que pour 10, 100 et 1 000.',
      },
    },

    {
      slug: 'multiplication-en-ligne',
      titre: 'La multiplication en ligne',
      source: 'ce1.mathematiques.la-multiplication-en-ligne-de-nombres-entiers',
      entrainement: { moduleId: 'tables', label: 'Tables' },
      fiche: {
        titre: 'La multiplication en ligne',
        idee: "Quand le nombre à multiplier est trop grand pour être dans la table, on le découpe. On multiplie chaque morceau séparément, puis on rassemble. C'est le même geste que pour l'addition en ligne.",
        regle: [
          "Je découpe : 24, c'est 20 et 4.",
          'Je multiplie chaque morceau par 3 : 20 × 3 = 60.',
          'Puis 4 × 3 = 12.',
          'Je rassemble : 60 + 12 = 72.',
        ],
        exemple: (
          <Etapes
            aligne="egal"
            lignes={['24 × 3 = ?', '20 × 3 = 60', '4 × 3 = 12', '60 + 12 = 72']}
          />
        ),
        piege:
          "Chaque morceau se multiplie, aucun ne s'oublie. Oublier le 4 donne 60, qui est le résultat de 20 × 3 et pas de 24 × 3.",
      },
    },

    {
      slug: 'partage',
      titre: "Le partage d'une quantité",
      source: 'ce1.mathematiques.le-partage-d-une-quantite',
      fiche: {
        titre: "Le partage d'une quantité",
        idee: "Partager, c'est distribuer en parts égales. On peut distribuer un par un, et c'est ce qu'on fait au début pour comprendre. Mais les tables vont plus vite : on cherche le nombre qui, multiplié par le nombre de parts, donne la quantité.",
        regle: [
          'Je partage 12 objets en 3 parts égales.',
          'Je cherche dans la table de 3 : 3 × ? = 12.',
          '3 × 4 = 12, donc chaque part est de 4 objets.',
        ],
        exemple: (
          <Etapes
            aligne="egal"
            lignes={['3 × 3 = 9', '3 × 4 = 12', '3 × 5 = 15']}
          />
        ),
        piege:
          "Le partage ne tombe pas toujours juste. 13 objets en 3 parts, c'est 4 chacun et il en reste 1. Ce reste existe, on ne le fait pas disparaître.",
      },
    },
  ],
};
