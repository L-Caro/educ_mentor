/**
 * Modèle de maîtrise unifié, partagé par tous les modules de jeu.
 *
 * Le score d'une notion = réussites nettes : une mauvaise réponse annule une bonne
 * (plancher à 0). Empêche qu'une notion répondue juste « par hasard » finisse maîtrisée.
 */

export const DEFAULT_MASTERY_THRESHOLD = 10;

/** Réussites nettes : correct − incorrect, jamais sous 0. */
export function masteryScore(
  correctCount: number,
  incorrectCount: number,
): number {
  return Math.max(0, correctCount - incorrectCount);
}

/** Une notion est maîtrisée quand son score atteint le seuil. Réversible (une erreur peut démaîtriser). */
export function isMastered(score: number, threshold: number): boolean {
  return score >= threshold;
}

/**
 * Poids de sélection (fréquence d'apparition) d'une notion selon son score.
 * Entiers proportionnels à 1.0 / 0.5 / 0.1 pour la sélection par réplication :
 *   score < seuil/2        → fréquence normale (10)
 *   seuil/2 ≤ score < seuil → moitié (5)
 *   score ≥ seuil          → faible mais non nulle (1)
 */
export function selectionWeight(score: number, threshold: number): number {
  if (score >= threshold) return 1;
  if (score >= threshold / 2) return 5;
  return 10;
}
