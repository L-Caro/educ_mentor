import type { GrandeNotion } from '../cours.types';
import NumerationRangs from 'src/modules/numeration/NumerationRangs';
import DroiteGraduee from '../components/DroiteGraduee';
import Etapes from '../components/Etapes';
import Paires from '../components/Paires';

/**
 * Les nombres jusqu'à 999, au CE1.
 *
 * Quatre concepts qui disent tous la même chose sous quatre angles : ce qui compte dans un
 * nombre écrit, ce n'est pas le chiffre, c'est sa PLACE. Lire, représenter, décomposer,
 * comparer sont quatre façons de s'en servir. L'ordre les enchaîne dans cet ordre-là.
 */

export const nombres: GrandeNotion = {
  slug: 'nombres-jusqu-a-999',
  titre: "Les nombres jusqu'à 999",
  resume:
    "Ce qui compte dans un nombre, c'est la place du chiffre. Lire, représenter, décomposer, comparer.",

  concepts: [
    {
      slug: 'lire-et-ecrire',
      titre: 'Lire et écrire les nombres',
      source: 'ce1.mathematiques.lire-et-ecrire-les-nombres-entiers-jusqu-a-999',
      entrainement: { moduleId: 'numeration', label: 'Numération' },
      fiche: {
        titre: 'Lire et écrire les nombres',
        idee: "Avec dix chiffres seulement, de 0 à 9, on écrit tous les nombres. Ce qui compte n'est donc pas le chiffre, c'est sa PLACE : dans 358, le 3 ne vaut pas trois, il vaut trois centaines.",
        regle: [
          'Le chiffre de droite compte les unités.',
          "Celui d'avant compte les dizaines : dix unités chacune.",
          "Celui d'encore avant compte les centaines : dix dizaines chacune.",
          "En lettres, un trait d'union entre les mots : trente-deux.",
        ],
        exemple: <NumerationRangs nombre={358} rang="c" />,
        piege:
          "Quatre-vingts prend un s, quatre-vingt-dix n'en prend pas. Vingt et cent ne prennent le s que s'ils finissent le nombre.",
      },
    },

    {
      slug: 'representer',
      titre: 'Représenter les nombres',
      source: 'ce1.mathematiques.representer-les-nombres-entiers-jusqu-a-999',
      entrainement: { moduleId: 'numeration', label: 'Numération' },
      fiche: {
        titre: 'La droite graduée',
        idee: "La droite graduée range les nombres du plus petit au plus grand, à intervalles réguliers. Elle sert à voir où tombe un nombre : entre lesquels il se trouve, et duquel il est le plus proche.",
        regle: [
          'Je repère les nombres déjà écrits.',
          "Je regarde de combien on avance d'une graduation à la suivante.",
          'Je cherche entre quels nombres le mien se place.',
        ],
        exemple: <DroiteGraduee graduations={[120, 130, 140, 150, 160, 170]} marque={155} />,
        piege:
          "La droite ne commence pas toujours à zéro, et les graduations ne vont pas toujours de 1 en 1. Il faut lire l'écart avant de placer quoi que ce soit.",
      },
    },

    {
      slug: 'decomposer',
      titre: 'Décomposer un nombre',
      source: 'ce1.mathematiques.decomposer-un-nombre-entier-jusqu-a-999',
      entrainement: { moduleId: 'numeration', label: 'Numération' },
      fiche: {
        titre: 'Décomposer un nombre',
        idee: "Décomposer, c'est écrire ce que vaut chaque chiffre selon sa place. On peut le dire en additions ou en multiplications : les deux écritures disent exactement la même chose.",
        regle: [
          "358, c'est 3 centaines, 5 dizaines et 8 unités.",
          '358 = 300 + 50 + 8',
          '358 = 3 × 100 + 5 × 10 + 8',
        ],
        exemple: (
          <Etapes
            aligne="egal"
            lignes={['300 + 50 + 8 = 358', '3 × 100 = 300', '5 × 10 = 50']}
          />
        ),
        piege:
          "Un zéro ne s'oublie pas. 308, c'est 3 centaines, 0 dizaine et 8 unités : sans le zéro, on écrirait 38, qui est un tout autre nombre.",
      },
    },

    {
      slug: 'comparer-et-ranger',
      titre: 'Comparer et ranger les nombres',
      source: 'ce1.mathematiques.comparer-et-ranger-les-nombres-jusqu-a-999',
      entrainement: { moduleId: 'numeration', label: 'Numération' },
      fiche: {
        titre: 'Comparer et ranger',
        idee: "Comparer deux nombres, c'est dire lequel est le plus grand. On regarde d'abord la longueur : celui qui a le plus de chiffres est le plus grand. À longueur égale, on compare chiffre par chiffre en partant de la GAUCHE, et on s'arrête dès qu'ils diffèrent.",
        regle: [
          "Ranger dans l'ordre croissant, c'est du plus petit au plus grand.",
          "Ranger dans l'ordre décroissant, c'est l'inverse.",
          '3 < 30 < 300 < 800',
        ],
        exemple: (
          <Paires
            colonnes={['on compare', 'ce qui décide']}
            lignes={[
              ['57 et 123', '2 chiffres contre 3'],
              ['327 et 645', '3 < 6 aux centaines'],
              ['312 et 345', '1 < 4 aux dizaines'],
              ['341 et 345', '1 < 5 aux unités'],
            ]}
          />
        ),
        piege:
          'La pointe du signe montre toujours le plus petit des deux. 3 < 7 se lit « 3 est plus petit que 7 ».',
      },
    },
  ],
};
