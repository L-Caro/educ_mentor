/** La normalisation d'une saisie, DUPLIQUÉE depuis `backend/src/modules/accords/accords.logic.ts`.
 *
 * Même situation que `dictee.tokens.ts`, qui reproduit `dictee.logic.ts` : les deux paquets
 * n'ont aucune dépendance entre eux, et la validation d'une saisie libre est faite côté
 * client par `<GameEngine>`. `accords-reponse.test.ts` vérifie sur disque que les deux
 * versions restent identiques : une divergence rendrait fausse une réponse juste, ou
 * l'inverse, sans qu'aucun typage ne s'en aperçoive.
 *
 * Ce module n'enlève PAS les accents, contrairement à `geometrie.game.tsx` qui accepte
 * « decagone » : là-bas l'orthographe est hors sujet, ici elle EST la réponse. « des
 * gateaux » sans circonflexe est une faute, et la passer enseignerait l'inverse de la leçon.
 *
 * Ce qui est toléré, parce que sans rapport avec l'accord : la casse, les espaces en trop,
 * et la forme de l'apostrophe : un clavier donne `'`, l'énoncé affiche `’`.
 */
export function normaliseReponse(saisie: string): string {
  return saisie
    .trim()
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, ' ');
}

export function reponseCorrecte(attendue: string, saisie: string): boolean {
  return normaliseReponse(attendue) === normaliseReponse(saisie);
}
