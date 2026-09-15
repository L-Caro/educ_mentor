/**
 * Une feuille d'exercices a imprimer.
 *
 * ── L'unite est l'EXERCICE, pas le module ────────────────────────────────────────────
 *
 * Tant qu'on imprime « une feuille de tables », l'unite naturelle est le module. Mais la
 * demande est de composer une feuille variee : deux horloges, trois tables, une addition
 * posee, une conjugaison. L'unite devient donc l'item, et un module n'est plus qu'un
 * fournisseur d'items parmi d'autres. Une feuille mono-module n'est qu'un cas
 * particulier : une seule ligne de composition.
 *
 * Le backend ne rend que des DONNEES. Comment un item se dessine sur le papier est une
 * affaire de rendu, donc de frontend, et cela vit dans le dossier du module concerne
 * (`<module>.impression.tsx`). Le meme partage que pour le jeu : le serveur engendre, le
 * navigateur affiche.
 */

/**
 * Une ligne de la composition : « dix exercices de tables, de ces trois sortes ».
 *
 * `exercices` est une LISTE, et c'est le coeur de la demande. Un module propose plusieurs
 * types (les tables en ont cinq : le produit, le facteur manquant, la decomposition, la
 * table complete, la suite). L'adulte coche ceux qu'il veut, donne un nombre, et les
 * exercices sont repartis entre eux.
 *
 * Une premiere version demandait un nombre PAR TYPE. C'etait plus expressif sur le
 * papier, et plus penible en pratique : il fallait faire l'arithmetique soi-meme pour
 * arriver a dix, et on n'avait jamais la variete sans y penser.
 */
export interface LigneComposition {
  module: string;
  exercices: string[];
  nombre: number;
  /** Reglages du CONTENU, communs aux types du module : quelles tables, quelles notions,
   * quels verbes. Ils ne dependent pas du type d'exercice mais de ce qu'on travaille. */
  options?: Record<string, unknown>;
}

/** Un exercice pose sur la feuille. `donnees` a la forme que le module lui donne ; seul
 * son rendu, cote frontend, sait la lire. */
export interface ItemImprime {
  module: string;
  exercice: string;
  donnees: Record<string, unknown>;
}

/** Au-dela, ce n'est plus une feuille d'exercices, c'est une punition. La borne protege
 * aussi le serveur : chaque item coute un tirage. */
export const MAXIMUM_ITEMS = 60;
