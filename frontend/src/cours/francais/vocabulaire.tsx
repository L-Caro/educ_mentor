import type { GrandeNotion } from '../cours.types';
import Paires from '../components/Paires';
import Phrases from '../components/Phrases';

/**
 * Le vocabulaire, au CE1.
 *
 * Cinq fiches dont trois portent sur un outil plutôt que sur une règle : l'alphabet, le
 * dictionnaire, les catégories. Ce sont des gestes de recherche, et ils s'expliquent en
 * les faisant. D'où des exemples qui montrent une manipulation, pas une définition.
 */

export const vocabulaire: GrandeNotion = {
  slug: 'vocabulaire',
  titre: 'Le vocabulaire',
  resume:
    "L'alphabet et le dictionnaire pour chercher, les synonymes et les étiquettes pour ranger.",

  concepts: [
    {
      slug: 'ordre-alphabetique',
      titre: "L'ordre alphabétique",
      source: 'ce1.francais.l-ordre-alphabetique',
      entrainement: { moduleId: 'pendu', label: 'Le pendu' },
      fiche: {
        titre: "L'ordre alphabétique",
        idee: "L'alphabet a 26 lettres, toujours dans le même ordre. Ranger des mots dans cet ordre, c'est comparer leur première lettre ; et quand elle est la même, passer à la suivante, jusqu'à ce qu'elles diffèrent.",
        regle: [
          'Je compare la première lettre.',
          "Si c'est la même, je passe à la deuxième.",
          "Et ainsi de suite, jusqu'à ce qu'elles soient différentes.",
        ],
        exemple: (
          <Phrases
            lignes={[
              '[c]hat et [c]hien : même première lettre',
              'c[h]at et c[h]ien : même deuxième',
              'ch[a]t et ch[i]en : a avant i, chat gagne',
            ]}
          />
        ),
        piege:
          'A, E, I, O, U, Y sont les voyelles, toutes les autres lettres sont des consonnes. Ça ne change pas le rangement, mais la question sera posée.',
      },
    },

    {
      slug: 'le-dictionnaire',
      titre: "L'usage du dictionnaire",
      source: 'ce1.francais.l-usage-du-dictionnaire',
      fiche: {
        titre: "L'usage du dictionnaire",
        idee: "Le dictionnaire donne le sens d'un mot et son orthographe. Comme tout y est rangé dans l'ordre alphabétique, on ne le feuillette pas au hasard : on vise, en s'aidant des mots repères écrits en haut de chaque page.",
        regle: [
          'Je cherche la première lettre du mot.',
          "Puis les suivantes, dans l'ordre.",
          'Les mots repères disent ce que la page contient.',
        ],
        exemple: (
          <Phrases
            lignes={[
              'mots repères : [chaise] et [chien]',
              'je cherche : chat',
              "chaise · [chat] · chien : c'est cette page",
            ]}
          />
        ),
        piege:
          "Un verbe se cherche à l'infinitif. « il courait » ne se trouve nulle part : c'est « courir » qu'il faut chercher.",
      },
    },

    {
      slug: 'synonymes-et-antonymes',
      titre: 'Les synonymes et les antonymes',
      source: 'ce1.francais.les-synonymes-et-les-antonymes',
      fiche: {
        titre: 'Les synonymes et les antonymes',
        idee: "Deux synonymes veulent dire à peu près la même chose, deux antonymes veulent dire le contraire. Les synonymes servent surtout à ne pas répéter le même mot dix fois dans un texte.",
        regle: [
          'Synonymes : content, joyeux, heureux.',
          'Antonymes : content et triste.',
          'À peu près le même sens, pas exactement le même.',
        ],
        exemple: (
          <Paires
            colonnes={['un mot', 'son contraire']}
            lignes={[
              ['grand', 'petit'],
              ['content', 'triste'],
              ['chaud', 'froid'],
              ['devant', 'derrière'],
            ]}
          />
        ),
        piege:
          "Deux synonymes ne s'échangent jamais parfaitement. « une grande maison » et « une vaste maison » ne disent pas tout à fait la même chose.",
      },
    },

    {
      slug: 'mot-etiquette',
      titre: 'Le mot-étiquette',
      source: 'ce1.francais.le-mot-etiquette',
      entrainement: { moduleId: 'imagier', label: 'Imagier' },
      fiche: {
        titre: 'Le mot-étiquette',
        idee: "Un mot-étiquette est un mot qui en range plusieurs autres : « fruits » range pomme, poire et cerise. Il ne les remplace pas, il les regroupe, et c'est ce qui permet de parler de tous d'un coup.",
        regle: [
          'Je regarde ce que les mots ont en commun.',
          'Je cherche le mot qui les contient tous.',
          'pomme, poire, cerise : ce sont des fruits.',
        ],
        exemple: (
          <Paires
            colonnes={['les mots', 'leur étiquette']}
            lignes={[
              ['pomme, poire, cerise', 'les fruits'],
              ['chien, chat, cheval', 'les animaux'],
              ['rouge, bleu, vert', 'les couleurs'],
            ]}
          />
        ),
        piege:
          "Une étiquette peut en contenir une autre. Un chat est un animal et aussi un mammifère : les deux sont justes, l'une est simplement plus précise.",
      },
    },

    {
      slug: 'vocabulaire-de-la-famille',
      titre: 'Le vocabulaire de la famille',
      source: 'ce1.francais.le-vocabulaire-de-la-famille',
      fiche: {
        titre: 'Le vocabulaire de la famille',
        idee: "Les mots de la famille disent qui est qui. Le plus déroutant, c'est que le même mot dépend de celui qui parle : une seule personne est à la fois la mère de l'un et la fille de l'autre.",
        regle: [
          'Les parents : le père et la mère.',
          'Leurs enfants : le fils, la fille, le frère, la sœur.',
          'Les parents des parents : les grands-parents.',
        ],
        exemple: (
          <Paires
            colonnes={['masculin', 'féminin']}
            lignes={[
              ['le père', 'la mère'],
              ['le fils', 'la fille'],
              ['le frère', 'la sœur'],
              ['le grand-père', 'la grand-mère'],
              ["l'oncle", 'la tante'],
            ]}
          />
        ),
        piege:
          "Le mot change avec le point de vue. Ta mère est la fille de ta grand-mère : c'est la même personne, et deux mots différents.",
      },
    },
  ],
};
