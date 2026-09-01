/** Découpage d'un contenu pour l'écran de correction : chaque mot devient un jeton
 * cliquable, la ponctuation et les espaces restent affichés mais inertes.
 *
 * `normalizeWordKey` reproduit la logique du backend (`dictee.logic.ts`) : les deux
 * doivent produire la même clé pour qu'un mot coché ici s'agrège au bon endroit. */

const EDGE_PUNCTUATION = /^[«»"'’“”().,;:!?…—–-]+|[«»"'’“”().,;:!?…—–-]+$/g;

/** Le mot sans la ponctuation de bord, casse conservée. */
export function cleanWord(token: string): string {
  return token.trim().replace(/’/g, "'").replace(EDGE_PUNCTUATION, '');
}

export function normalizeWordKey(token: string): string {
  return cleanWord(token).toLowerCase();
}

export interface ContenuToken {
  /** Position dans la liste, clé de rendu stable. */
  index: number;
  /** Le jeton tel qu'écrit (mot + ponctuation accolée, ou suite d'espaces). */
  text: string;
  /** Vrai si c'est un mot cliquable. */
  isWord: boolean;
  /** Clé de suivi normalisée, '' quand ce n'est pas un mot. */
  wordKey: string;
}

export function tokenize(contenu: string): ContenuToken[] {
  return contenu
    .split(/(\s+)/)
    .filter((chunk) => chunk !== '')
    .map((text, index) => {
      const isSpace = /^\s+$/.test(text);
      const wordKey = isSpace ? '' : normalizeWordKey(text);
      return { index, text, isWord: wordKey !== '', wordKey };
    });
}
