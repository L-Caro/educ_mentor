import type { ReactNode } from 'react';

/**
 * Ce qu'un module doit savoir faire pour apparaitre sur une feuille imprimee.
 *
 * L'unite est l'EXERCICE, pas le module : une feuille melange deux horloges, trois
 * tables et une addition posee. Un module n'est donc qu'un fournisseur d'items parmi
 * d'autres, et une feuille mono-module n'est qu'un cas particulier.
 *
 * Le backend rend des donnees, jamais du rendu. Comment un exercice se dessine sur le
 * papier vit ici, dans le dossier du module (`<module>.impression.tsx`), au plus pres de
 * ce qu'il sait de lui-meme.
 */

/** Un item pose sur la feuille, tel que le serveur le rend. */
export interface ItemImprime {
  module: string;
  exercice: string;
  donnees: Record<string, unknown>;
}

/**
 * Un reglage propre a un exercice : quelles tables, quelles notions, combien de formes.
 *
 * Sans ces reglages, une feuille de tables sort les onze tables melangees et une feuille
 * de grammaire toutes les notions ouvertes. C'est utilisable, mais ca ne permet pas de
 * travailler ce qu'on veut travailler, qui est le seul interet d'une feuille faite a la
 * main plutot que tiree au hasard.
 *
 * Les listes peuvent etre STATIQUES (les tables vont de 0 a 10, ca ne changera pas) ou
 * chargees (les notions ouvertes dependent de l'administration). Dans le second cas on ne
 * propose que ce qui est ACTIF : imprimer une notion fermee contournerait le seul reglage
 * qui decide de ce que l'enfant voit, exactement comme pour le peage.
 */
export interface ChoixImprimable {
  valeur: string;
  label: string;
}

export type OptionImprimable =
  | {
      cle: string;
      label: string;
      type: 'multi';
      choix?: ChoixImprimable[];
      charger?: () => Promise<ChoixImprimable[]>;
      /** Rien de coche = pas de filtre, le module choisit librement. */
    }
  | {
      cle: string;
      label: string;
      type: 'nombre';
      min: number;
      max: number;
      defaut: number;
    };

export interface ExerciceImprimable {
  /** Identifiant envoye au serveur, avec le module : `tables/produit`. */
  cle: string;
  /** Ce que lit l'adulte en composant sa feuille. */
  label: string;
  /**
   * La place que prend l'exercice.
   *
   * `colonne` par defaut, et il faut s'y tenir : une A4 fait 21 cm de large, et presque
   * tout ce qu'on imprime ici tient dans la moitie. Une addition posee a trois chiffres
   * occupe quatre centimetres, pas une page.
   */
  largeur?: 'colonne' | 'pleine';
  /** L'enonce, avec le blanc pour ecrire. */
  enonce: (donnees: Record<string, unknown>) => ReactNode;
  /** La reponse, pour la page de corrige. Courte : elle est lue en diagonale. */
  reponse: (donnees: Record<string, unknown>) => ReactNode;
  /** Ce qu'on peut regler avant de tirer. Voir `OptionImprimable`. */
  options?: OptionImprimable[];
}

export interface FournisseurImpression {
  /** Le nom du module sur la page de composition. */
  label: string;
  exercices: ExerciceImprimable[];
}

/** Une ligne de composition, telle que l'adulte la coche. */
export interface LigneComposition {
  module: string;
  exercice: string;
  nombre: number;
  options?: Record<string, unknown>;
}
