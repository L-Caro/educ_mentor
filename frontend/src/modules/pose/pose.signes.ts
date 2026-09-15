/** Le signe imprime de chaque operation posee.
 *
 * Dans son propre fichier, et non a cote du composant : un module qui exporte a la fois
 * un composant et une constante casse le rechargement a chaud de Vite.
 *
 * Le moins est un vrai signe moins (U+2212), pas un trait d'union : sur une operation
 * posee, un trait d'union est plus court et plus haut, et la colonne ne tombe plus juste.
 */
export const SIGNE: Record<string, string> = {
  addition: '+',
  soustraction: '−',
  multiplication: '×',
};
