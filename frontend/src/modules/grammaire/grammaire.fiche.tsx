import type { Fiche } from 'src/types/fiche.types';
import PhraseMarquee from './PhraseMarquee';
import type { GrammaireQuestion, NotionKey } from './grammaire.type';

/**
 * L'explication proposée après une erreur.
 *
 * Le contenu vient des fiches déjà écrites et validées dans `cours/francais/` —
 * `nature-des-mots.tsx` et `fonction-des-mots.tsx`. Ce n'est pas de la duplication par
 * paresse : la fiche du cours est du JSX rangé dans un arbre de notions, la fiche de jeu
 * est une fonction pure de la question. Ce qui doit rester commun, c'est le TEXTE que
 * l'enfant lit — elle ne doit pas rencontrer deux explications différentes du verbe selon
 * qu'elle joue ou qu'elle révise.
 *
 * Le principe de ces fiches, à ne pas défaire : chacune donne un TEST, pas une définition.
 * « Le verbe sert à décrire une action » ne permet de reconnaître aucun verbe ; « le mot
 * qui change quand je change le moment » le permet.
 *
 * La fonction est pure — c'est la clause du contrat de `spec.fiche`, qui permettra au mode
 * « école » d'engendrer sa bibliothèque en appelant les mêmes fonctions.
 */

interface Lecon {
  titre: string;
  idee: string;
  regle: string[];
  piege: string;
}

const LECONS: Record<NotionKey, Lecon> = {
  nom_commun: {
    titre: 'Le nom commun',
    idee: "Le nom sert à désigner : un objet, un animal, une personne, un lieu. C'est le mot devant lequel on peut mettre un, une, le ou la, et ce test suffit presque toujours à le reconnaître.",
    regle: [
      'un chat, une table, le jardin.',
      'Je mets un ou une devant : ça marche.',
      "Devant un verbe, ça ne marche pas : « un dort » ne se dit pas.",
    ],
    piege:
      "Le même mot peut être un nom ici et un verbe ailleurs : la porte grince, mais elle porte une robe. C'est la phrase qui décide, jamais le mot seul.",
  },
  nom_propre: {
    titre: 'Le nom propre',
    idee: "Le nom propre désigne quelqu'un ou quelque chose en particulier : une personne, un animal, une ville. Il prend toujours une majuscule, et il se passe de déterminant.",
    regle: [
      'Maëve, Paris, Médor : des noms propres.',
      'un chat, une ville : des noms communs.',
      'Le nom propre garde sa majuscule partout.',
    ],
    piege:
      "La majuscule ne suffit pas à le reconnaître : le premier mot de chaque phrase en porte une aussi, et ce n'est pas pour ça qu'il est un nom propre.",
  },
  verbe: {
    titre: 'Le verbe',
    idee: "Le verbe dit ce qui se passe : ce qu'on fait, ce qui arrive, ou comment on est. Pour le trouver, on ne cherche pas une action : on change le moment de la phrase, et on regarde quel mot bouge.",
    regle: [
      'Je dis la phrase au présent, puis hier.',
      "Le mot qui change, c'est le verbe.",
      'Le chien aboie. Hier, le chien aboyait.',
    ],
    piege:
      "Un verbe ne décrit pas toujours une action. être et avoir sont des verbes aussi : elle est contente, elle a froid.",
  },
  determinant: {
    titre: 'Le déterminant',
    idee: "Le déterminant est le petit mot placé devant le nom. Il n'est pas décoratif : c'est lui qui annonce si le nom est masculin ou féminin, au singulier ou au pluriel.",
    regle: [
      'un, le : masculin singulier.',
      'une, la : féminin singulier.',
      'des, les : pluriel. mon, ma, ses : aussi des déterminants.',
    ],
    piege:
      "Devant une voyelle, le et la deviennent l' : l'arbre, l'école. Le déterminant est toujours là, mais il ne dit plus le genre.",
  },
  adjectif: {
    titre: "L'adjectif qualificatif",
    idee: "L'adjectif dit comment est le nom : un grand chien, une maison bleue. Le test pour le reconnaître : on peut l'enlever, et la phrase reste correcte. Le nom, lui, ne s'enlève pas.",
    regle: [
      'Il se place devant le nom : un grand chien.',
      'Ou derrière : une maison bleue.',
      "Je l'enlève pour vérifier : un chien, une maison. Ça tient.",
    ],
    piege:
      'Un nom peut porter plusieurs adjectifs, devant et derrière à la fois : un petit chat noir. Ils se rapportent tous au même nom.',
  },
  pronom_sujet: {
    titre: 'Le pronom personnel sujet',
    idee: "Le pronom personnel sujet prend la place d'un nom ou d'un groupe nominal, pour éviter de le répéter. Il est toujours sujet, et c'est donc lui qui commande l'accord du verbe.",
    regle: [
      'je, tu, il, elle : une seule personne.',
      'nous, vous, ils, elles : plusieurs.',
      'Maëve chante devient elle chante.',
    ],
    piege:
      "Le pronom remplace le groupe nominal, il ne s'y ajoute pas : on ne dit pas « le chat il dort ».",
  },
  invariable: {
    titre: 'Le mot invariable',
    idee: "Certains mots ne changent jamais d'écriture : ni au féminin, ni au pluriel, jamais. On les appelle les mots invariables. Il n'y a aucune règle pour les reconnaître, et c'est pour ça qu'on les apprend par cœur.",
    regle: [
      'toujours, jamais, souvent, beaucoup.',
      'dans, avec, chez, sans, alors.',
      "Ils s'écrivent pareil dans toutes les phrases.",
    ],
    piege:
      "Presque tous finissent par une lettre qu'on n'entend pas : le s de toujours, de dans, de alors. C'est cette lettre-là qu'on oublie.",
  },
  groupe_nominal: {
    titre: 'Le groupe nominal',
    idee: "Le groupe nominal, c'est le nom et tous les mots qui l'accompagnent : son déterminant, et ses adjectifs s'il en a. Il se déplace d'un bloc dans la phrase, et c'est justement comme ça qu'on le repère.",
    regle: [
      'Il contient toujours un déterminant et un nom.',
      'Il peut contenir un ou plusieurs adjectifs.',
      "le petit chat noir : c'est un seul groupe nominal.",
    ],
    piege:
      'Un nom propre forme un groupe nominal à lui tout seul, sans déterminant : Maëve dort.',
  },
  sujet: {
    titre: 'Le sujet du verbe',
    idee: "Le sujet, c'est qui fait l'action. Pour le trouver, on ne devine pas : on cherche d'abord le verbe, puis on demande « qui est-ce qui ? » devant lui. Ce qui répond est le sujet.",
    regle: [
      'Je trouve le verbe.',
      'Je demande : qui est-ce qui... ?',
      'La réponse est le sujet, en entier.',
    ],
    piege:
      "Le sujet n'est pas toujours devant le verbe. Dans « Sous la table dort le chat », c'est le chat qui dort.",
  },
  complement: {
    titre: 'Le complément',
    idee: "Le complément donne une information de plus sur le verbe : où, quand, comment. La différence avec le sujet tient en un test : on peut souvent l'enlever, et la phrase reste correcte.",
    regle: [
      'Il répond à où, quand, comment.',
      'Il peut suivre le verbe, ou en être loin.',
      "Je l'enlève : la phrase tient encore.",
    ],
    piege:
      "Enlever un complément ne casse pas la phrase, mais lui retire une information. « Le chat dort » reste correct, et c'est ce test qui distingue le complément du sujet.",
  },
};

export function grammaireFiche(question: GrammaireQuestion): Fiche {
  const lecon = LECONS[question.skill_key];

  return {
    titre: lecon.titre,
    idee: lecon.idee,
    regle: lecon.regle,
    // L'exemple est la phrase que l'enfant vient de rater, avec la réponse en évidence.
    // Un exemple neuf lui demanderait de faire deux fois le chemin.
    exemple: (
      <PhraseMarquee
        mots={question.mots}
        marques={question.answer_indices}
        variante="surligne"
      />
    ),
    piege: lecon.piege,
  };
}
