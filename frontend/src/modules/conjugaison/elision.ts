/** Applique l'élision je → j' devant voyelle ou h muet : « j'ai », pas « je ai ».
 * Partagé entre la correction affichée pendant le jeu et le tableau de la fiche —
 * les deux montrent les mêmes formes et doivent les écrire pareil. */
export function applyElision(pronoun: string, form: string): string {
  if (pronoun === 'je' && /^[aeiouyéèêëàâîïôùûhœæAEIOUYÉÈÊËÀÂÎÏÔÙÛH]/u.test(form)) {
    return `j'${form}`;
  }
  return `${pronoun} ${form}`;
}
