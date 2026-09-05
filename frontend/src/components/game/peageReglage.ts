/** Au-delà, ce n'est plus un péage, c'est une séance de travail déguisée en jeu. Le
 * serveur applique la même borne : celle-là protège l'API, celle-ci protège l'affichage. */
export const MAXIMUM_QUESTIONS = 5;

/** Le nombre de questions à poser avant d'ouvrir un plateau, lu depuis les réglages.
 *
 * `0`, la valeur par défaut, l'illisible et le négatif, veut dire « pas de péage ». Un
 * péage qui s'installerait tout seul changerait l'application sous les pieds de l'enfant,
 * sans que personne l'ait décidé.
 *
 * Dans son propre fichier, et non dans `Peage.tsx` : un module qui exporte à la fois un
 * composant et des fonctions casse le rechargement à chaud de Vite. */
export function lireNombre(brut: string | undefined): number {
  const n = parseInt(brut ?? '0', 10);
  if (Number.isNaN(n) || n <= 0) return 0;
  return Math.min(MAXIMUM_QUESTIONS, n);
}
