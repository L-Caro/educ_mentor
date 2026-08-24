import type { GrandeNotion } from '../cours.types';
import Paires from '../components/Paires';
import Phrases from '../components/Phrases';

/**
 * La nature des mots, au CE1.
 *
 * Presque rien à reprendre du corpus ici : ses six leçons tiennent en une définition
 * chacune, et TOUS leurs exemples sont dans des images. C'est donc de la rédaction.
 *
 * Le parti pris : chaque fiche donne un TEST, pas une définition. « Le verbe sert à
 * décrire une action » ne permet de reconnaître aucun verbe ; « le mot qui change quand
 * je change le moment » le permet. Un enfant de CE1 ne classe pas des mots par ce qu'ils
 * signifient, il les classe par ce qu'ils font dans la phrase.
 *
 * Cette notion vient avant « Les accords » : on ne peut pas accorder ce qu'on ne sait pas
 * nommer.
 */

export const natureDesMots: GrandeNotion = {
  slug: 'nature-des-mots',
  titre: 'La nature des mots',
  resume:
    'Reconnaître un nom, un verbe, un déterminant, un adjectif. Un test par nature, pas une définition.',

  concepts: [
    {
      slug: 'le-nom',
      titre: 'Le nom',
      source: 'ce1.francais.le-nom',
      fiche: {
        titre: 'Le nom',
        idee: "Le nom sert à désigner : un objet, un animal, une personne, un lieu. C'est le mot devant lequel on peut mettre un, une, le ou la, et ce test suffit presque toujours à le reconnaître.",
        regle: [
          'un chat, une table, le jardin : des noms communs.',
          'Maëve, Paris, Médor : des noms propres.',
          'Le nom propre prend toujours une majuscule.',
        ],
        exemple: (
          <Phrases
            lignes={['Le [chat] dort sur la [table].', '[Maëve] habite à [Paris].']}
          />
        ),
        piege:
          "Le nom propre garde sa majuscule au milieu de la phrase. Ce n'est pas la place dans la phrase qui décide, c'est le mot lui-même.",
      },
    },

    {
      slug: 'le-verbe',
      titre: 'Le verbe',
      source: 'ce1.francais.le-verbe',
      entrainement: { moduleId: 'conjugaison', label: 'Conjugaison' },
      fiche: {
        titre: 'Le verbe',
        idee: "Le verbe dit ce qui se passe : ce qu'on fait, ce qui arrive, ou comment on est. Pour le trouver, on ne cherche pas une action : on change le moment de la phrase, et on regarde quel mot bouge.",
        regle: [
          'Je dis la phrase au présent, puis hier.',
          "Le mot qui change, c'est le verbe.",
          'Le chien aboie. Hier, le chien aboyait.',
        ],
        exemple: (
          <Phrases
            lignes={['Le chien [aboie] fort.', 'Hier, le chien [aboyait] fort.']}
          />
        ),
        piege:
          "Un verbe ne décrit pas toujours une action. être et avoir sont des verbes aussi : elle est contente, elle a froid.",
      },
    },

    {
      slug: 'les-determinants',
      titre: 'Les déterminants',
      source: 'ce1.francais.les-determinants',
      fiche: {
        titre: 'Les déterminants',
        idee: "Le déterminant est le petit mot placé devant le nom. Il n'est pas décoratif : c'est lui qui annonce si le nom est masculin ou féminin, au singulier ou au pluriel. Souvent, c'est le seul moyen de le savoir.",
        regle: [
          'un, le : masculin singulier.',
          'une, la : féminin singulier.',
          'des, les : pluriel, masculin ou féminin.',
        ],
        exemple: (
          <Paires
            colonnes={['singulier', 'pluriel']}
            lignes={[
              ['un chat', 'des chats'],
              ['une table', 'des tables'],
              ['le jardin', 'les jardins'],
              ['la maison', 'les maisons'],
            ]}
          />
        ),
        piege:
          "Devant une voyelle, le et la deviennent l' : l'arbre, l'école. Le déterminant est toujours là, mais il ne dit plus le genre.",
      },
    },

    {
      slug: 'l-adjectif',
      titre: "L'adjectif qualificatif",
      source: 'ce1.francais.l-adjectif-qualificatif',
      fiche: {
        titre: "L'adjectif qualificatif",
        idee: "L'adjectif dit comment est le nom : un grand chien, une maison bleue. Le test pour le reconnaître : on peut l'enlever, et la phrase reste correcte. Le nom, lui, ne s'enlève pas.",
        regle: [
          'Il se place devant le nom : un grand chien.',
          'Ou derrière : une maison bleue.',
          "Je l'enlève pour vérifier : un chien, une maison. Ça tient.",
        ],
        exemple: (
          <Phrases
            lignes={['un [grand] chien', 'une maison [bleue]', 'un [petit] chat [noir]']}
          />
        ),
        piege:
          'Un nom peut porter plusieurs adjectifs, devant et derrière à la fois : un petit chat noir. Ils se rapportent tous au même nom.',
      },
    },

    {
      slug: 'les-pronoms-sujets',
      titre: 'Les pronoms personnels sujets',
      source: 'ce1.francais.les-pronoms-personnels-sujets',
      entrainement: { moduleId: 'conjugaison', label: 'Conjugaison' },
      fiche: {
        titre: 'Les pronoms personnels sujets',
        idee: "Le pronom personnel sujet prend la place d'un nom ou d'un groupe nominal, pour éviter de le répéter. Il est toujours sujet, et c'est donc lui qui commande l'accord du verbe.",
        regle: [
          'je, tu, il, elle : une seule personne.',
          'nous, vous, ils, elles : plusieurs.',
          'Maëve chante devient elle chante.',
        ],
        exemple: (
          <Phrases
            lignes={[
              '[Maëve] chante. → [Elle] chante.',
              '[Les enfants] jouent. → [Ils] jouent.',
            ]}
          />
        ),
        piege:
          "Le pronom prend le genre du groupe : elles seulement si toutes sont des filles, ils dès qu'il y a un garçon.",
      },
    },

    {
      slug: 'les-mots-invariables',
      titre: 'Les mots invariables',
      source: 'ce1.francais.les-mots-invariables',
      fiche: {
        titre: 'Les mots invariables',
        idee: "Certains mots ne changent jamais d'écriture : ni au féminin, ni au pluriel, jamais. On les appelle les mots invariables. Il n'y a aucune règle pour les reconnaître, et c'est justement pour ça qu'on les apprend par cœur.",
        regle: [
          'toujours, jamais, souvent, beaucoup.',
          'dans, avec, chez, sans, alors.',
          "Ils s'écrivent pareil dans toutes les phrases.",
        ],
        exemple: (
          <Phrases
            lignes={[
              'Elle mange [beaucoup].',
              'Ils mangent [beaucoup].',
              'Elles jouent [dehors] [avec] [nous].',
            ]}
          />
        ),
        piege:
          "Presque tous finissent par une lettre qu'on n'entend pas : le s de toujours, de dans, de alors, de plusieurs. C'est cette lettre-là qu'on oublie.",
      },
    },
  ],
};
