import type { Fiche } from 'src/types/fiche.types';
import AccordsExemple from './AccordsExemple';
import type { AccordsQuestion, NotionKey } from './accords.type';

/**
 * L'explication proposée après une erreur.
 *
 * Le texte vient des cinq fiches déjà écrites et validées dans
 * `cours/francais/accords.tsx`. L'enfant ne doit pas rencontrer deux explications
 * différentes du même accord selon qu'elle joue ou qu'elle révise.
 *
 * Le fil de ces fiches, à ne pas défaire : **un accord ne s'entend presque jamais, il se
 * voit**. C'est pour ça que c'est difficile, et pour ça que chaque fiche le montre marque
 * par marque au lieu de l'énoncer.
 *
 * La fonction est pure — clause du contrat de `spec.fiche`.
 */

interface Lecon {
  titre: string;
  idee: string;
  regle: string[];
  piege: string;
}

const LECONS: Record<NotionKey, Lecon> = {
  genre_nom: {
    titre: 'Le genre des noms',
    idee: "Chaque nom est masculin ou féminin. Ce n'est pas une question de sens : une table n'a rien de féminin. C'est le déterminant qui le révèle, et c'est pour ça qu'on apprend toujours un nom avec son déterminant.",
    regle: [
      'Si je peux dire un ou le : le nom est masculin.',
      'Si je peux dire une ou la : le nom est féminin.',
    ],
    piege:
      "Le genre ne se devine pas, il se sait. Un pétale, une pédale : rien dans le mot ne l'annonce.",
  },
  nombre_nom: {
    titre: 'Le nombre des noms',
    idee: "Un nom est au singulier quand il désigne un seul être ou une seule chose, au pluriel quand il en désigne plusieurs. Le pluriel ne s'entend presque jamais : c'est à l'écrit qu'il se voit.",
    regle: [
      'En général, le pluriel ajoute un s.',
      'Les noms en -eau, -au, -eu prennent un x.',
      'Les noms en -s, -x, -z ne changent pas.',
    ],
    piege:
      'Le déterminant prévient : des, les, mes annoncent un pluriel. Quand il est au pluriel, le nom doit suivre.',
  },
  accord_adjectif: {
    titre: "L'adjectif s'accorde",
    idee: "L'adjectif n'a pas de genre à lui : il emprunte celui du nom qu'il accompagne, et son nombre aussi. Changer le nom change donc l'adjectif, même quand on n'entend aucune différence.",
    regle: [
      'Au féminin, en général on ajoute un e.',
      'Au pluriel, en général on ajoute un s.',
      'Je regarde le nom, pas l’adjectif : c’est lui qui commande.',
    ],
    piege:
      'Certains adjectifs ne changent pas au féminin : rouge, jaune, calme. Ils se terminent déjà par un e.',
  },
  accord_gn: {
    titre: "L'accord dans le groupe nominal",
    idee: "Dans un groupe nominal, tout s'aligne sur le nom : le déterminant et les adjectifs prennent son genre et son nombre. Le nom commande, les autres suivent. Il n'y a donc qu'un seul mot à examiner.",
    regle: [
      'Je trouve le nom.',
      'Je regarde son genre et son nombre.',
      'Je mets le déterminant et les adjectifs pareil.',
    ],
    piege:
      "L'adjectif s'accorde même quand il est loin du nom, et même quand il y en a deux : les chats noirs et blancs. Les deux prennent le s.",
  },
  accord_sujet_verbe: {
    titre: "L'accord sujet-verbe",
    idee: "Le verbe s'écrit différemment selon qui fait l'action : on dit qu'il s'accorde avec son sujet. Le plus souvent ça ne s'entend pas. Il dort et ils dorment se prononcent presque pareil, mais ne s'écrivent pas pareil.",
    regle: [
      "Je cherche qui fait l'action : c'est le sujet.",
      'Un seul : le verbe reste au singulier.',
      'Plusieurs : le verbe prend -nt.',
    ],
    piege:
      "Le sujet n'est pas toujours le mot juste devant le verbe. Dans « les chats de la voisine dorment », c'est chats qui commande, pas voisine.",
  },
};

export function accordsFiche(question: AccordsQuestion): Fiche {
  const lecon = LECONS[question.skill_key];

  return {
    titre: lecon.titre,
    idee: lecon.idee,
    regle: lecon.regle,
    exemple: <AccordsExemple question={question} />,
    piege: lecon.piege,
  };
}
