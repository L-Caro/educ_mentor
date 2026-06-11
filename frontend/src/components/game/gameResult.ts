import type { ReactNode } from 'react';

/**
 * Entrée de résultat normalisée, produite par `buildResultEntry` de chaque module et
 * consommée par `<GameResultView>` / `<GameErrorList>`. Une seule forme pour les 4 modules.
 */
export interface GameResultEntry {
  label: ReactNode;          // énoncé de la question (déjà formaté)
  given: ReactNode | null;   // réponse donnée (déjà formatée) ; null si non affichée / timeout
  expected: ReactNode;       // bonne réponse (déjà formatée)
  correct: boolean;
  timeout: boolean;
  thumbUrl?: string | null;  // miniature (Imagier) ; absent = pas de vignette
}
