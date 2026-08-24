import type { GrandeNotion } from '../cours.types';
import Etapes from '../components/Etapes';
import Paires from '../components/Paires';

/**
 * Grandeurs et mesures, au CE1.
 *
 * Cinq grandeurs, un même geste : choisir l'unité qui convient à ce qu'on mesure, puis
 * savoir passer d'une unité à l'autre. C'est la seule chose que le CE1 demande, et les
 * tableaux de conversion viendront bien assez tôt.
 *
 * Chaque fiche donne des ORDRES DE GRANDEUR plutôt que des définitions. « Le gramme est
 * l'unité de masse » n'aide personne à choisir entre grammes et kilogrammes ; savoir
 * qu'une pomme fait 150 g et un sac de farine 1 kg, si.
 */

export const mesures: GrandeNotion = {
  slug: 'grandeurs-et-mesures',
  titre: 'Grandeurs et mesures',
  resume:
    "Longueurs, masses, contenances, temps, monnaie. Choisir la bonne unité, et passer de l'une à l'autre.",

  concepts: [
    {
      slug: 'longueurs',
      titre: 'Les longueurs',
      source: 'ce1.mathematiques.les-longueurs',
      fiche: {
        titre: 'Les longueurs',
        idee: "Mesurer une longueur, c'est dire combien de fois une unité y tient. On choisit l'unité selon ce qu'on mesure : on ne mesure pas une gomme en kilomètres, ni une route en centimètres.",
        regle: [
          'Le centimètre (cm) pour un crayon, une gomme.',
          'Le mètre (m) pour une pièce, un tissu.',
          'Le kilomètre (km) pour une route.',
        ],
        exemple: (
          <Etapes aligne="egal" lignes={['1 dm = 10 cm', '1 m = 100 cm', '1 km = 1 000 m']} />
        ),
        piege:
          'Pour comparer deux longueurs, il faut la même unité. 90 cm et 1 m ne se comparent pas tant que le mètre est écrit en mètres.',
      },
    },

    {
      slug: 'masses',
      titre: 'Les masses',
      source: 'ce1.mathematiques.les-masses',
      fiche: {
        titre: 'Les masses',
        idee: "La masse dit combien un objet est lourd. On la mesure en grammes, et en kilogrammes dès que l'objet est un peu lourd. Un kilogramme, c'est mille grammes.",
        regle: [
          'La balance Roberval compare : le plateau qui descend porte le plus lourd.',
          "Pour peser, on ajoute des poids marqués jusqu'à l'équilibre.",
          "La masse de l'objet est la somme des poids posés.",
        ],
        exemple: (
          <Paires
            colonnes={['objet', 'sa masse']}
            lignes={[
              ['une pomme', '150 g'],
              ['un paquet de farine', '1 kg'],
              ['un enfant de CE1', '25 kg'],
            ]}
          />
        ),
        piege:
          "1 kg = 1 000 g. Un kilo de plumes et un kilo de plomb pèsent donc pareil : c'est la place qu'ils prennent qui diffère, pas la masse.",
      },
    },

    {
      slug: 'contenances',
      titre: 'Les contenances',
      source: 'ce1.mathematiques.les-contenances',
      fiche: {
        titre: 'Les contenances',
        idee: "La contenance, c'est la quantité qu'un récipient peut contenir. On la mesure en litres, avec un verre doseur gradué : on lit le nombre qui se trouve à la hauteur du liquide.",
        regle: [
          'Je pose le verre doseur bien à plat.',
          'Je regarde à quelle graduation arrive le liquide.',
          'Je lis le nombre à cette hauteur.',
        ],
        exemple: (
          <Paires
            colonnes={['récipient', 'sa contenance']}
            lignes={[
              ['un verre', 'moins de 1 L'],
              ["une bouteille d'eau", '1 L'],
              ['un arrosoir', '5 L'],
            ]}
          />
        ),
        piege:
          "La contenance n'est pas la taille du récipient. Un grand vase étroit peut contenir moins qu'un petit saladier large.",
      },
    },

    {
      slug: 'dates-et-durees',
      titre: 'Les dates et les durées',
      source: 'ce1.mathematiques.les-dates-et-les-durees',
      entrainement: { moduleId: 'heure', label: "L'heure" },
      fiche: {
        titre: 'Les dates et les durées',
        idee: "Une durée, c'est du temps qui passe : elle se compte en heures et en minutes. Une date, c'est un moment précis dans l'année : elle se lit sur le calendrier. Ce sont deux questions différentes, et on ne les mesure pas pareil.",
        regle: [
          'La petite aiguille donne les heures.',
          'La grande aiguille donne les minutes, un tour en 60 minutes.',
          "Une date, c'est le jour, le quantième, le mois et l'année.",
        ],
        exemple: (
          <Etapes
            aligne="egal"
            lignes={[
              '1 heure = 60 minutes',
              '1 jour = 24 heures',
              '1 semaine = 7 jours',
              '1 année = 12 mois',
            ]}
          />
        ),
        piege:
          "Le temps ne se compte pas de 10 en 10. Après 1 h 45 vient 1 h 46, mais après 1 h 59 vient 2 h 00 : on ne dit jamais 1 h 60.",
      },
    },

    {
      slug: 'monnaie',
      titre: 'La monnaie',
      source: 'ce1.mathematiques.la-monnaie',
      entrainement: { moduleId: 'monnaie', label: 'La monnaie' },
      fiche: {
        titre: 'La monnaie',
        idee: "En France on paie en euros. Une même somme peut se donner de plusieurs façons : c'est tout l'exercice. Faire l'appoint, c'est donner la somme exacte ; rendre la monnaie, c'est calculer ce qui reste en trop.",
        regle: [
          "Je cherche d'abord les grosses coupures qui tiennent.",
          'Je complète avec les plus petites.',
          "Rendre la monnaie, c'est une soustraction.",
        ],
        exemple: (
          <Etapes
            aligne="egal"
            lignes={['1 € = 100 centimes', '7 € = 5 € + 2 €', '7 € = 2 € + 2 € + 2 € + 1 €']}
          />
        ),
        piege:
          "Il n'y a pas de pièce de 3 € ni de 4 €. Les valeurs existantes sont 1, 2, 5, 10, 20, 50 : tout le reste se compose.",
      },
    },
  ],
};
