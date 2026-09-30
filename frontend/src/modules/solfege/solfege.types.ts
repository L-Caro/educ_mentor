/** Les exercices du module, nommés une fois pour toutes.
 *
 * Dans leur propre fichier : déclarés à côté du composant, ils empêchent le
 * rechargement à chaud de fonctionner, qui exige qu'un fichier de composants n'exporte
 * que des composants.
 */
export const TYPES_SOLFEGE = [
  'lire',
  'placer',
  'figure',
  'mesure',
  'rythme',
  'dictee',
  'oreille',
] as const;

export type TypeSolfege = (typeof TYPES_SOLFEGE)[number];
