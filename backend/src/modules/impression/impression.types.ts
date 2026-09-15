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

/** Une ligne de la composition : « trois multiplications », « deux horloges ». */
export interface LigneComposition {
  module: string;
  exercice: string;
  nombre: number;
  /** Reglages propres a l'exercice : quelles tables, quels temps, jusqu'ou compter. */
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
