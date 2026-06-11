export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

/** Ramène une valeur quelconque (body) sur une difficulté valide ; défaut `medium`. */
export function normalizeDifficulty(raw: unknown): Difficulty {
  return DIFFICULTIES.includes(raw as Difficulty) ? (raw as Difficulty) : 'medium';
}

/** Nombre de choix d'un QCM pour une difficulté ; `0` = saisie libre. */
export function qcmChoiceCount(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':
      return 2;
    case 'medium':
      return 4;
    case 'hard':
      return 0;
  }
}
