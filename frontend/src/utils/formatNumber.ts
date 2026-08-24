/** Insère une espace insécable (U+00A0) tous les 3 chiffres : "123456" -> "123 456".
 * Échappée plutôt que saisie littéralement : un caractère invisible dans le source est
 * indétectable à la relecture et se perd au copier-coller. */
export function formatNumbers(text: string | number): string {
  return String(text).replace(/\d+/g, (match) => match.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00A0'));
}
