import type { ReactNode } from 'react';

/**
 * Le contenu d'une fiche de leçon, quelle que soit son origine.
 *
 * Deux sources la produiront, avec la même forme en sortie :
 *   - dérivée de la question elle-même (`spec.fiche`) — conjugaison, tables, calcul…
 *     Là où le module possède déjà la donnée, la fiche ne coûte rien à produire et
 *     porte exactement sur ce que l'enfant vient de rater.
 *   - rédigée une fois et rangée en bibliothèque — géographie, histoire, sciences,
 *     où le « pourquoi » ne se déduit d'aucune règle.
 *
 * Un seul type en sortie, donc un seul composant de rendu, et un futur mode « école »
 * qui n'aura rien à réimplémenter : il appellera les mêmes fonctions.
 */
export interface Fiche {
  /** Ce sur quoi porte la fiche : « chanter », « 7 × 8 », « et quart ». */
  titre: string;
  /** L'idée clé, en une phrase. C'est ce qui doit rester si tout le reste est oublié. */
  idee: string;
  /** La règle, littérale, en monospace. Un tableau donne une ligne par élément :
   * une décomposition en six rangs sur une seule ligne déborde et devient illisible. */
  regle?: string | string[];
  /** L'exemple. Le module rend ce qu'il veut : tableau, cadran, pièces, illustration. */
  exemple?: ReactNode;
  /** L'erreur classique — souvent la raison pour laquelle l'enfant vient de se tromper. */
  piege?: string;
}
