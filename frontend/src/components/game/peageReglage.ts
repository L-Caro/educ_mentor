/** Au-delà, ce n'est plus un péage, c'est une séance de travail déguisée en jeu. Le
 * serveur applique la même borne : celle-là protège l'API, celle-ci protège l'affichage. */
export const MAXIMUM_QUESTIONS = 5;

/** Une partie sur dix au plus : au-delà, l'enfant aurait oublié qu'un péage existe. */
export const MAXIMUM_FREQUENCE = 10;

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

/** Une partie sur combien est barrée. `1` = toutes. */
export function lireFrequence(brut: string | undefined): number {
  const n = parseInt(brut ?? '1', 10);
  if (Number.isNaN(n) || n <= 1) return 1;
  return Math.min(MAXIMUM_FREQUENCE, n);
}

const CLE_RESTANTES = 'educmentor.peage.restantes';

/** Combien de parties restent libres avant le prochain péage.
 *
 * Par APPAREIL, pas par compte : le compteur vit dans le navigateur. C'est assumé, une
 * remise à zéro n'a aucune conséquence, et la seule alternative serait de compter les
 * lancements côté serveur, donc d'enregistrer quelque chose que le péage a justement
 * choisi de ne pas enregistrer.
 *
 * Borné à la lecture : baisser la fréquence de 5 à 2 dans l'administration ne doit pas
 * laisser courir les trois parties libres déjà comptées. */
export function lireRestantes(frequence: number): number {
  try {
    const n = parseInt(localStorage.getItem(CLE_RESTANTES) ?? '0', 10);
    if (Number.isNaN(n) || n <= 0) return 0;
    return Math.min(n, frequence - 1);
  } catch {
    // Stockage refusé (navigation privée, réglages) : le péage se pose à chaque partie
    // au lieu d'une sur X. Plus strict que demandé, jamais bloquant.
    return 0;
  }
}

export function ecrireRestantes(valeur: number): void {
  try {
    localStorage.setItem(CLE_RESTANTES, String(Math.max(0, valeur)));
  } catch {
    /* sans mémoire, le péage se pose à chaque partie : acceptable */
  }
}
