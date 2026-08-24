import type { GrandeNotion } from '../cours.types';
import Formes from '../components/Formes';
import Paires from '../components/Paires';
import Phrases from '../components/Phrases';

/**
 * Espace et géométrie, au CE1.
 *
 * La notion la plus visuelle du programme, et la seule qu'aucun texte ne remplace : un
 * carré se reconnaît, il ne se récite pas. Les figures sont tracées en SVG plutôt que
 * reprises du corpus, pour une raison qui compte plus que l'esthétique : le SVG permet de
 * MARQUER l'angle droit, les côtés égaux, l'axe de symétrie. Sur une capture d'image,
 * l'enfant doit deviner ce qu'il faut regarder.
 *
 * L'ordre va du plus simple au plus construit : d'abord le trait, puis les instruments qui
 * le tracent, puis les figures, puis les solides. Le repérage et le déplacement ferment la
 * notion, parce qu'ils ne parlent plus de figures mais de position.
 */

export const geometrie: GrandeNotion = {
  slug: 'espace-et-geometrie',
  titre: 'Espace et géométrie',
  resume:
    'Le trait, les instruments, les figures, les solides. Puis se repérer et se déplacer.',

  concepts: [
    {
      slug: 'segments-et-droites',
      titre: 'Les segments et les droites',
      source: 'ce1.mathematiques.les-segments-et-les-droites',
      fiche: {
        titre: 'Les segments et les droites',
        idee: "Une droite est une ligne parfaitement tendue qui n'a ni début ni fin : on ne peut donc pas la mesurer. Un segment est un morceau de droite entre deux points, et lui se mesure. C'est toute la différence, et elle décide de ce qu'on peut en faire.",
        regle: [
          'La droite se prolonge au-delà de la feuille.',
          'Le segment a deux extrémités, notées par des lettres majuscules.',
          'Des points sur une même droite sont alignés.',
        ],
        exemple: (
          <Formes
            items={[
              { forme: 'droite', legende: 'une droite' },
              { forme: 'segment', legende: 'le segment AB' },
              { forme: 'milieu', legende: 'son milieu' },
            ]}
          />
        ),
        piege:
          "Le milieu d'un segment n'est pas « à peu près au centre » : c'est le point qui coupe le segment en deux longueurs exactement égales. Il se mesure à la règle.",
      },
    },

    {
      slug: 'instruments-de-trace',
      titre: 'Les instruments de tracé',
      source: 'ce1.mathematiques.les-instruments-de-trace',
      fiche: {
        titre: 'Les instruments de tracé',
        idee: "Trois instruments, trois usages qui ne se recouvrent pas. La règle trace droit et mesure, l'équerre vérifie les angles droits, le compas trace les cercles. Choisir le bon instrument est déjà la moitié du tracé.",
        regle: [
          "Pour mesurer, je pose le zéro de la règle sur l'extrémité.",
          "Je tiens la règle d'une main pour qu'elle ne bouge pas.",
          'Je suis le bord de la règle sans trop appuyer.',
        ],
        exemple: (
          <Paires
            colonnes={['instrument', 'à quoi il sert']}
            lignes={[
              ['la règle graduée', 'tracer droit et mesurer'],
              ["l'équerre", 'vérifier un angle droit'],
              ['le compas', 'tracer un cercle'],
            ]}
          />
        ),
        piege:
          "Pour mesurer, c'est le ZÉRO de la règle qu'on pose sur le début du trait, pas le bord de la règle. Les deux ne sont presque jamais au même endroit.",
      },
    },

    {
      slug: 'le-carre',
      titre: 'Le carré',
      source: 'ce1.mathematiques.le-carre',
      fiche: {
        titre: 'Le carré',
        idee: "Un carré a quatre côtés de la MÊME longueur et quatre angles droits. Les deux conditions comptent : quatre côtés égaux sans angles droits donnent un losange, quatre angles droits sans côtés égaux donnent un rectangle.",
        regle: [
          "Quatre côtés, donc c'est un quadrilatère.",
          'Ses quatre côtés ont la même longueur.',
          'Ses quatre angles sont droits.',
        ],
        exemple: (
          <Formes
            items={[
              { forme: 'carre', legende: 'un carré' },
              { forme: 'rectangle', legende: 'un rectangle' },
            ]}
          />
        ),
        piege:
          "Un carré est aussi un rectangle : il a bien quatre angles droits. C'est un rectangle dont les longueurs et les largeurs sont égales.",
      },
    },

    {
      slug: 'le-rectangle',
      titre: 'Le rectangle',
      source: 'ce1.mathematiques.le-rectangle',
      fiche: {
        titre: 'Le rectangle',
        idee: "Un rectangle a quatre angles droits et ses côtés se répondent deux par deux : deux longueurs égales, deux largeurs égales. Pour le tracer, on choisit ces deux mesures avant de commencer.",
        regle: [
          'Deux grands côtés : les longueurs.',
          'Deux petits côtés : les largeurs.',
          'Quatre sommets et quatre angles droits.',
        ],
        exemple: (
          <Formes items={[{ forme: 'rectangle', legende: 'un rectangle' }]} />
        ),
        piege:
          "Sur un quadrillage, on compte les carreaux et le tracé est juste. Sur une feuille blanche, la règle ne suffit pas : sans équerre, les angles ne sont pas droits.",
      },
    },

    {
      slug: 'les-triangles',
      titre: 'Les triangles',
      source: 'ce1.mathematiques.les-triangles',
      fiche: {
        titre: 'Les triangles',
        idee: "Un triangle est une figure fermée à trois côtés. Trois côtés, trois sommets, trois angles : c'est la figure la plus simple qu'on puisse fermer. Certains triangles ont un angle droit, et on les appelle des triangles rectangles.",
        regle: [
          'Trois côtés, trois sommets, trois angles.',
          'La figure doit être fermée.',
          "Un angle droit, et c'est un triangle rectangle.",
        ],
        exemple: (
          <Formes
            items={[
              { forme: 'triangle', legende: 'un triangle' },
              { forme: 'triangleRectangle', legende: 'un triangle rectangle' },
            ]}
          />
        ),
        piege:
          "L'angle droit d'un triangle rectangle ne se devine pas à l'œil. On le vérifie à l'équerre, et c'est la seule façon d'en être sûr.",
      },
    },

    {
      slug: 'le-cercle',
      titre: 'Le cercle',
      source: 'ce1.mathematiques.le-cercle',
      fiche: {
        titre: 'Le cercle',
        idee: "Un cercle est une ligne courbe fermée dont tous les points sont à la même distance d'un point appelé le centre. C'est exactement ce que fait le compas : une pointe au centre, l'autre qui tourne à distance constante.",
        regle: [
          'Je plante la pointe du compas sur le centre.',
          "J'écarte les branches de la distance voulue.",
          "Je fais tourner le compas d'un seul geste.",
        ],
        exemple: <Formes items={[{ forme: 'cercle', legende: 'un cercle et son centre' }]} />,
        piege:
          "Sans compas, on peut suivre le contour d'un verre ou d'une assiette. Mais on ne connaît alors pas le centre : il faudra le retrouver autrement.",
      },
    },

    {
      slug: 'les-solides',
      titre: 'Les solides',
      source: 'ce1.mathematiques.les-solides',
      fiche: {
        titre: 'Les solides',
        idee: "Un solide est un objet qu'on peut prendre dans la main, et dont les faces sont des figures planes. On les reconnaît en comptant : combien de faces, combien de sommets, combien d'arêtes, et de quelle forme sont les faces.",
        regle: [
          'Le cube : 6 faces carrées, 8 sommets, 12 arêtes.',
          'Le pavé droit : 6 faces rectangulaires, 8 sommets, 12 arêtes.',
          'La pyramide : 5 faces, 5 sommets, 8 arêtes.',
          'Le cône : 2 faces et 1 sommet pointu.',
        ],
        exemple: (
          <Formes
            items={[
              { forme: 'cube', legende: 'un cube' },
              { forme: 'pave', legende: 'un pavé droit' },
              { forme: 'pyramide', legende: 'une pyramide' },
              { forme: 'cone', legende: 'un cône' },
            ]}
          />
        ),
        piege:
          "Un cube est un pavé droit particulier : ses six faces sont des carrés, et un carré est un rectangle. Le patron le montre bien, en dépliant les six faces à plat.",
      },
    },

    {
      slug: 'la-symetrie',
      titre: 'La symétrie',
      source: 'ce1.mathematiques.la-symetrie',
      fiche: {
        titre: 'La symétrie',
        idee: "Une figure a un axe de symétrie quand on peut la plier le long d'une ligne et que les deux moitiés se recouvrent exactement. Le pliage n'est pas une image : c'est le test, et on peut vraiment le faire avec du papier.",
        regle: [
          "Je plie la figure le long d'une ligne.",
          "Si les deux moitiés se superposent, c'est un axe.",
          'Une figure peut avoir plusieurs axes, ou aucun.',
        ],
        exemple: (
          <Formes
            items={[
              { forme: 'symetrie', legende: 'un axe de symétrie' },
              { forme: 'sansSymetrie', legende: 'aucun axe' },
            ]}
          />
        ),
        piege:
          "Se ressembler ne suffit pas : les deux moitiés doivent se SUPERPOSER exactement. Une moitié un peu plus grande que l'autre, et l'axe n'en est pas un.",
      },
    },

    {
      slug: 'se-reperer',
      titre: "Le repérage dans l'espace",
      source: 'ce1.mathematiques.le-reperage-dans-l-espace',
      fiche: {
        titre: 'Se repérer',
        idee: "Se repérer, c'est dire où l'on est par rapport à autre chose. Les mots suffisent dans une pièce (à gauche, dessous, entre) ; sur un quadrillage ou un plan, il faut un code, parce que « là-bas » ne se transmet pas.",
        regle: [
          'Sur un quadrillage, une case se nomme par sa colonne puis sa ligne.',
          "La colonne d'abord, la ligne ensuite : toujours dans cet ordre.",
          'Sur une carte, on utilise les points cardinaux.',
        ],
        exemple: <Formes items={[{ forme: 'quadrillage', legende: 'colonne, puis ligne' }]} />,
        piege:
          "L'ordre du code n'est pas au choix : B2 et 2B ne désignent pas la même chose. La colonne se donne toujours en premier.",
      },
    },

    {
      slug: 'se-deplacer',
      titre: "Le déplacement dans l'espace",
      source: 'ce1.mathematiques.le-deplacement-dans-l-espace',
      fiche: {
        titre: 'Se déplacer',
        idee: "Se déplacer, c'est changer de place en suivant un chemin. Pour qu'un déplacement puisse être écrit et refait par quelqu'un d'autre, il lui faut trois choses : d'où on part, le chemin, et où on arrive.",
        regle: [
          'Je donne le code de la case de départ.',
          'Je note le chemin avec des flèches, une par case.',
          "Je donne le code de la case d'arrivée.",
        ],
        exemple: (
          <Phrases
            lignes={[
              'départ : [A1]',
              'chemin : → → ↓',
              'arrivée : [C2]',
            ]}
          />
        ),
        piege:
          "Une flèche vaut exactement une case. Deux cases vers la droite se notent avec deux flèches, pas avec une flèche plus longue.",
      },
    },
  ],
};
