import {
  DEFAULT_MASTERY_THRESHOLD,
  isMastered,
  masteryScore,
  selectionWeight,
} from './mastery';

/**
 * Modèle de maîtrise partagé par les treize modules. Une erreur ici se traduit par une
 * progression fausse pour l'enfant — soit des notions déclarées acquises à tort, soit des
 * notions maîtrisées qui reviennent sans fin. Rien ne le signalerait.
 */

describe('masteryScore', () => {
  it('compte les réussites nettes', () => {
    expect(masteryScore(7, 2)).toBe(5);
  });

  it('ne descend jamais sous zéro', () => {
    // Sans le plancher, une série d'échecs creuserait une dette que l'enfant devrait
    // combler avant de voir sa progression bouger — démotivant et invisible.
    expect(masteryScore(1, 9)).toBe(0);
    expect(masteryScore(0, 0)).toBe(0);
  });

  it('annule une bonne réponse par une mauvaise', () => {
    // C'est la raison d'être du modèle : empêcher qu'une notion devinée au hasard
    // finisse comptée comme maîtrisée.
    expect(masteryScore(5, 5)).toBe(0);
  });
});

describe('isMastered', () => {
  it('bascule pile au seuil, pas juste avant', () => {
    expect(isMastered(9, 10)).toBe(false);
    expect(isMastered(10, 10)).toBe(true);
    expect(isMastered(11, 10)).toBe(true);
  });

  it('est réversible : une erreur peut démaîtriser', () => {
    const threshold = DEFAULT_MASTERY_THRESHOLD;
    expect(isMastered(masteryScore(10, 0), threshold)).toBe(true);
    expect(isMastered(masteryScore(10, 1), threshold)).toBe(false);
  });
});

describe('selectionWeight', () => {
  const threshold = 10;

  it('donne la fréquence maximale à une notion peu travaillée', () => {
    expect(selectionWeight(0, threshold)).toBe(10);
    expect(selectionWeight(4, threshold)).toBe(10);
  });

  it('réduit de moitié à partir du demi-seuil', () => {
    expect(selectionWeight(5, threshold)).toBe(5);
    expect(selectionWeight(9, threshold)).toBe(5);
  });

  it('garde un poids faible mais NON NUL une fois maîtrisée', () => {
    // Un poids nul ferait disparaître définitivement la notion du tirage : plus aucune
    // révision, et la démaîtrise deviendrait impossible à constater.
    expect(selectionWeight(10, threshold)).toBe(1);
    expect(selectionWeight(999, threshold)).toBe(1);
  });

  it('reste monotone décroissant quand le score augmente', () => {
    const weights = Array.from({ length: 25 }, (_, score) =>
      selectionWeight(score, threshold),
    );
    for (let i = 1; i < weights.length; i++) {
      expect(weights[i]).toBeLessThanOrEqual(weights[i - 1]);
    }
  });

  it('supporte un seuil impair sans trou de couverture', () => {
    // seuil 7 → demi-seuil 3.5 : tous les scores entiers doivent recevoir un poids connu.
    for (let score = 0; score <= 10; score++) {
      expect([1, 5, 10]).toContain(selectionWeight(score, 7));
    }
  });
});
