import {
  DIFFICULTIES,
  normalizeDifficulty,
  qcmChoiceCount,
} from './difficulty';

/**
 * `normalizeDifficulty` est la frontière entre le corps de requête (non fiable) et la
 * génération de questions. Elle est appelée avant toute validation métier.
 */

describe('normalizeDifficulty', () => {
  it('laisse passer les difficultés valides', () => {
    for (const difficulty of DIFFICULTIES) {
      expect(normalizeDifficulty(difficulty)).toBe(difficulty);
    }
  });

  it('retombe sur `medium` pour toute valeur inattendue', () => {
    for (const input of [
      undefined,
      null,
      '',
      'HARD',
      'facile',
      42,
      {},
      [],
      true,
    ]) {
      expect(normalizeDifficulty(input)).toBe('medium');
    }
  });
});

describe('qcmChoiceCount', () => {
  it('donne moins de choix quand c’est plus facile', () => {
    expect(qcmChoiceCount('easy')).toBe(2);
    expect(qcmChoiceCount('medium')).toBe(4);
  });

  it('signale la saisie libre par zéro choix', () => {
    // Le moteur front dérive le mode de la présence de choix : 0 = saisie libre.
    // Renvoyer 1 au lieu de 0 afficherait un QCM à réponse unique — toujours juste.
    expect(qcmChoiceCount('hard')).toBe(0);
  });

  it('couvre toutes les difficultés déclarées', () => {
    for (const difficulty of DIFFICULTIES) {
      expect(typeof qcmChoiceCount(difficulty)).toBe('number');
    }
  });
});
