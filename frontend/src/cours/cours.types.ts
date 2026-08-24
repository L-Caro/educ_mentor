import type { Fiche } from 'src/types/fiche.types';

/**
 * La bibliothèque de cours : matière → grande notion → concept → fiche.
 *
 * Le lecteur visé est le PARENT, pas l'enfant. « Si je vois qu'en rentrant elle a du mal
 * sur poser une soustraction, on ouvre l'app et les fiches maths, on les lit. » C'est ce
 * qui décide de tout le reste : on navigue par ce qu'on cherche à travailler, pas par une
 * progression imposée, et rien n'est verrouillé derrière un exercice.
 *
 * Le corpus Kartable sert de SOURCE, jamais de contenu livré : chaque fiche est réécrite.
 * Le corpus est d'ailleurs plat (355 notions, aucun niveau intermédiaire) : le regroupement
 * en grandes notions est un jugement posé ici, il n'est pas dans la donnée.
 */

/** Les réglages d'administration, tels que l'API les renvoie. */
export type Reglages = Record<string, string>;

/**
 * La plupart des fiches sont fixes. Quelques-unes dépendent d'un réglage : la soustraction
 * posée s'écrit de deux façons, et montrer celle que la maîtresse n'enseigne pas est pire
 * que ne rien montrer. Une fonction plutôt qu'une valeur, donc, mais seulement là où c'est
 * nécessaire : une fiche fixe reste écrite comme une fiche fixe.
 */
export type FicheDeConcept = Fiche | ((reglages: Reglages) => Fiche);

/** Un point précis du programme, tenant sur une fiche. */
export interface Concept {
  /** Segment d'URL, stable : il finira dans un lien partagé ou un signet. */
  slug: string;
  titre: string;
  fiche: FicheDeConcept;
  /**
   * La tuile où s'entraîner sur ce point, quand elle existe.
   *
   * La fiche de la bibliothèque et celle qu'une tuile produit en jeu ne font pas double
   * emploi : celle du jeu explique CETTE question, celle-ci explique la notion. Mais elles
   * ne doivent pas se contredire, d'où le lien plutôt qu'une redite.
   */
  entrainement?: { moduleId: string; label: string };
  /** Leçon du corpus qui a servi de source. Traçabilité pour la relecture, jamais affiché. */
  source?: string;
}

/** Un thème du programme, qui rassemble les concepts qu'on travaille ensemble. */
export interface GrandeNotion {
  slug: string;
  titre: string;
  /** Ce que le parent y trouvera, en une phrase. Affiché dans la liste. */
  resume: string;
  concepts: Concept[];
}

export interface Matiere {
  slug: string;
  titre: string;
  emoji: string;
  notions: GrandeNotion[];
}

/** Résout la fiche d'un concept, qu'elle dépende ou non des réglages. */
export function ficheDe(concept: Concept, reglages: Reglages): Fiche {
  return typeof concept.fiche === 'function' ? concept.fiche(reglages) : concept.fiche;
}
