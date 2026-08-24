import type { GrandeNotion } from '../cours.types';
import Paires from '../components/Paires';
import Phrases from '../components/Phrases';

/**
 * Les accords, au CE1.
 *
 * La notion se lit APRÈS « La nature des mots » : on ne peut pas accorder ce qu'on ne
 * sait pas nommer. Les cinq fiches racontent une seule histoire, dans l'ordre : de quoi
 * un nom est marqué (genre, nombre), comment l'adjectif recopie ces marques, puis les
 * deux accords qu'on demande vraiment à l'école.
 *
 * Le fil : un accord ne s'entend presque jamais, il se voit. C'est pour ça que c'est
 * difficile, et c'est pour ça que chaque fiche le MONTRE, marque par marque.
 */

export const accords: GrandeNotion = {
  slug: 'accords',
  titre: 'Les accords',
  resume:
    "Un accord ne s'entend presque jamais, il se voit. Le genre, le nombre, puis les deux accords qu'on demande à l'école.",

  concepts: [
    {
      slug: 'genre-des-noms',
      titre: 'Le genre des noms',
      source: 'ce1.francais.le-genre-des-noms-masculin-feminin',
      fiche: {
        titre: 'Le genre des noms',
        idee: "Chaque nom est masculin ou féminin. Ce n'est pas une question de sens : une table n'a rien de féminin. C'est le déterminant qui le révèle, et c'est pour ça qu'on apprend toujours un nom avec son déterminant.",
        regle: [
          'Si je peux dire un ou le : le nom est masculin.',
          'Si je peux dire une ou la : le nom est féminin.',
        ],
        exemple: (
          <Paires
            colonnes={['masculin', 'féminin']}
            lignes={[
              ['un chat', 'une chatte'],
              ['le jardin', 'la maison'],
              ['un livre', 'une table'],
            ]}
          />
        ),
        piege:
          "Le genre ne se devine pas, il se sait. Un pétale, une pédale : rien dans le mot ne l'annonce.",
      },
    },

    {
      slug: 'nombre-des-noms',
      titre: 'Le nombre des noms',
      source: 'ce1.francais.le-nombre-des-noms-singulier-pluriel',
      fiche: {
        titre: 'Le nombre des noms',
        idee: "Un nom est au singulier quand il désigne un seul être ou une seule chose, au pluriel quand il en désigne plusieurs. Le pluriel ne s'entend presque jamais : c'est à l'écrit qu'il se voit.",
        regle: [
          'En général, le pluriel ajoute un s.',
          'Les noms en -eau, -au, -eu prennent un x.',
          'Les noms en -s, -x, -z ne changent pas.',
        ],
        exemple: (
          <Paires
            colonnes={['singulier', 'pluriel']}
            lignes={[
              ['un chat', 'des chat{s}'],
              ['un gâteau', 'des gâteau{x}'],
              ['un cheveu', 'des cheveu{x}'],
              ['une souris', 'des souris'],
            ]}
          />
        ),
        piege:
          'Le déterminant prévient : des, les, mes annoncent un pluriel. Quand il est au pluriel, le nom doit suivre.',
      },
    },

    {
      slug: 'genre-et-nombre-de-l-adjectif',
      titre: "Le genre et le nombre de l'adjectif",
      source: 'ce1.francais.le-genre-et-le-nombre-de-l-adjectif',
      fiche: {
        titre: "L'adjectif s'accorde",
        idee: "L'adjectif n'a pas de genre à lui : il emprunte celui du nom qu'il accompagne, et son nombre aussi. Changer le nom change donc l'adjectif, même quand on n'entend aucune différence.",
        regle: [
          'Au féminin, en général on ajoute un e.',
          'Au pluriel, en général on ajoute un s.',
          'Les adjectifs en -eau prennent un x : beau, beaux.',
        ],
        exemple: (
          <Paires
            colonnes={['masculin', 'féminin']}
            lignes={[
              ['un petit chat', 'une petit{e} chatte'],
              ['des petit{s} chats', 'des petit{es} chattes'],
            ]}
          />
        ),
        piege:
          'Certains adjectifs ne changent pas au féminin : rouge, jaune, calme. Ils se terminent déjà par un e.',
      },
    },

    {
      slug: 'accord-groupe-nominal',
      titre: "L'accord dans le groupe nominal",
      source: 'ce1.francais.l-accord-dans-le-groupe-nominal',
      fiche: {
        titre: "L'accord dans le groupe nominal",
        idee: "Dans un groupe nominal, tout s'aligne sur le nom : le déterminant et les adjectifs prennent son genre et son nombre. Le nom commande, les autres suivent. Il n'y a donc qu'un seul mot à examiner.",
        regle: [
          'Je trouve le nom.',
          'Je regarde son genre et son nombre.',
          'Je mets le déterminant et les adjectifs pareil.',
        ],
        exemple: (
          <Phrases
            lignes={[
              'le petit chat noir',
              'le{s} petit{s} chat{s} noir{s}',
              'la petit{e} chatte noir{e}',
            ]}
          />
        ),
        piege:
          "L'adjectif s'accorde même quand il est loin du nom, et même quand il y en a deux : les chats noirs et blancs. Les deux prennent le s.",
      },
    },

    {
      slug: 'accord-sujet-verbe',
      titre: "L'accord sujet-verbe",
      source: 'ce1.francais.l-accord-sujet-verbe',
      entrainement: { moduleId: 'conjugaison', label: 'Conjugaison' },
      fiche: {
        titre: "L'accord sujet-verbe",
        idee: "Le verbe s'écrit différemment selon qui fait l'action : on dit qu'il s'accorde avec son sujet. Le plus souvent ça ne s'entend pas. Il dort et ils dorment se prononcent presque pareil, mais ne s'écrivent pas pareil.",
        regle: [
          "Je cherche qui fait l'action : c'est le sujet.",
          'Un seul : le verbe reste au singulier.',
          'Plusieurs : le verbe prend -nt.',
        ],
        exemple: (
          <Phrases
            lignes={[
              'Le chat dort.',
              'Les chats dorm{ent}.',
              'Maëve et Léa chant{ent}.',
            ]}
          />
        ),
        piege:
          "Le sujet n'est pas toujours le mot juste devant le verbe. Dans « les chats de la voisine dorment », c'est chats qui commande, pas voisine.",
      },
    },
  ],
};
