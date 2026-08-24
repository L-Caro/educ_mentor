import { describe, expect, it } from 'vitest';
import { calculFiche, kindOf } from 'src/modules/calcul/calcul.fiche';
import { heureFiche } from 'src/modules/heure/heure.fiche';
import { monnaieFiche } from 'src/modules/monnaie/monnaie.fiche';
import { numerationFiche } from 'src/modules/numeration/numeration.fiche';
import type { MonnaieQuestion } from 'src/modules/monnaie/monnaie.type';
import type { NumerationQuestion } from 'src/modules/numeration/numeration.type';

/** Aucune fiche ne doit employer de cadratin dans le texte affiché (cf. frontend/CLAUDE.md). */
function assertPropre(f: { titre: string; idee: string; regle?: string; piege?: string }) {
  for (const texte of [f.titre, f.idee, f.regle ?? '', f.piege ?? '']) {
    expect(texte).not.toContain('—');
  }
  expect(f.titre.length).toBeGreaterThan(2);
  expect(f.idee.length).toBeGreaterThan(20);
}

describe('calcul', () => {
  it("reconnaît chaque forme d'énoncé produite par le serveur", () => {
    // Ces formes viennent de generateForType() ; si elles changent, ce test le dit.
    expect(kindOf('3 + ? = 10')).toBe('complement');
    expect(kindOf('? + 3 = 10')).toBe('complement');
    expect(kindOf('16 + 31 = ?')).toBe('addition');
    expect(kindOf('10 - 3 = ?')).toBe('soustraction');
    expect(kindOf('Double de 6 = ?')).toBe('double');
    expect(kindOf('Moitié de 12 = ?')).toBe('moitie');
  });

  it('remplace le point d’interrogation par la réponse', () => {
    expect(calculFiche({ operation: '16 + 31 = ?', answer: 47, choices: [] }).regle)
      .toBe('16 + 31 = 47');
  });

  it('explique le double et la moitié par leur opération inverse', () => {
    expect(calculFiche({ operation: 'Double de 6 = ?', answer: 12, choices: [] }).regle)
      .toBe('6 + 6 = 12');
    expect(calculFiche({ operation: 'Moitié de 12 = ?', answer: 6, choices: [] }).regle)
      .toBe('6 + 6 = 12');
  });

  it('donne une fiche générique plutôt que fausse sur un énoncé inconnu', () => {
    // Un motif approximatif classait cette chaîne comme un complément.
    expect(kindOf('?? bizarre ??')).toBeNull();
    expect(kindOf('3+?=10')).toBeNull();          // espaces manquants : forme non produite
    assertPropre(calculFiche({ operation: '?? bizarre ??', answer: 1, choices: [] }));
  });

  it('reste propre sur toutes les formes', () => {
    for (const op of ['3 + ? = 10', '16 + 31 = ?', '10 - 3 = ?', 'Double de 6 = ?', 'Moitié de 12 = ?']) {
      assertPropre(calculFiche({ operation: op, answer: 7, choices: [] }));
    }
  });
});

describe('heure', () => {
  const q = (hour: number, minute: number) =>
    ({ hour, minute, answer_value: hour * 60 + minute, numeral_type: 'arabic' as const, choices: [] });

  it('nomme les repères du cadran', () => {
    expect(heureFiche(q(3, 15)).regle).toContain('et quart');
    expect(heureFiche(q(3, 30)).regle).toContain('et demie');
    expect(heureFiche(q(3, 0)).regle).toContain('pile');
  });

  it("annonce l'heure suivante pour « moins le quart »", () => {
    // 7h45 se dit « 8 heures moins le quart » : l'erreur classique est de dire 7.
    const f = heureFiche(q(7, 45));
    expect(f.regle).toContain('8 heures moins le quart');
    expect(f.piege).toContain("l'heure d'après");
  });

  it('passe de 12h45 à 1 heure moins le quart, pas 13', () => {
    expect(heureFiche(q(12, 45)).regle).toContain('1 heures moins le quart');
  });

  it('traduit les heures de l’après-midi', () => {
    const f = heureFiche(q(15, 20));
    expect(f.regle).toContain('3 heures');
    expect(f.regle).toContain("l'après-midi");
  });

  it('conseille de compter de 5 en 5 hors des repères', () => {
    expect(heureFiche(q(4, 23)).idee).toContain('5 en 5');
  });

  it('reste propre sur les 24 heures et les minutes clés', () => {
    for (let h = 0; h < 24; h++) {
      for (const m of [0, 7, 15, 30, 45, 59]) assertPropre(heureFiche(q(h, m)));
    }
  });
});

describe('monnaie', () => {
  const q = (over: Partial<MonnaieQuestion>): MonnaieQuestion =>
    ({ type: 'reconnaitre', answer: 0, choices: [], ...over });

  it('additionne les pièces à reconnaître, en euros', () => {
    const f = monnaieFiche(q({ type: 'reconnaitre', coins: [200, 50, 20], answer: 270 }));
    expect(f.regle).toBe('2,00 € + 0,50 € + 0,20 € = 2,70 €');
  });

  it('pose la soustraction pour rendre la monnaie', () => {
    const f = monnaieFiche(q({ type: 'rendre', price: 340, payment: 500, answer: 160 }));
    expect(f.regle).toBe('5,00 € moins 3,40 € = 1,60 €');
    expect(f.piege).toContain('différence');
  });

  it('somme les prix pour un total', () => {
    expect(monnaieFiche(q({ type: 'total', prices: [150, 250], answer: 400 })).regle)
      .toBe('1,50 € + 2,50 € = 4,00 €');
  });

  it('supporte une question incomplète sans produire une règle fausse', () => {
    // Si les détails manquent, mieux vaut afficher le seul montant sûr que bricoler.
    expect(monnaieFiche(q({ type: 'rendre', answer: 160 })).regle).toBe('1,60 €');
    assertPropre(monnaieFiche(q({ type: 'reconnaitre', answer: 160 })));
  });

  it('reste propre sur les trois exercices', () => {
    for (const type of ['reconnaitre', 'total', 'rendre'] as const) {
      assertPropre(monnaieFiche(q({ type, coins: [100], prices: [100], price: 100, payment: 200, answer: 100 })));
    }
  });
});

describe('numeration', () => {
  const q = (over: Partial<NumerationQuestion>): NumerationQuestion => ({
    item_key: 'k', type: 'comparaison', display: '12  34', answer: '<',
    choices: [], decompose_positions: null, suite_terms: null, ...over,
  });

  it('rappelle le sens du signe de comparaison', () => {
    expect(numerationFiche(q({ type: 'comparaison' })).piege).toContain('plus petit');
  });

  it('déduit le pas d’une suite', () => {
    expect(numerationFiche(q({ type: 'suite', suite_terms: [4, 8, 12], answer: '16' })).regle)
      .toBe('+4 à chaque fois → 16');
  });

  it('nomme les rangs d’une décomposition', () => {
    const f = numerationFiche(q({
      type: 'decomposition', decompose_positions: ['c', 'd', 'u'], answer: '3:4:5',
    }));
    expect(f.regle).toBe('3 centaines + 4 dizaines + 5 unités');
  });

  it('couvre les quatre types sans trou', () => {
    for (const type of ['comparaison', 'suite', 'decomposition', 'valeur_positionnelle'] as const) {
      const f = numerationFiche(q({ type, suite_terms: [2, 4], decompose_positions: ['u'], answer: '2' }));
      expect(f).toBeDefined();
      assertPropre(f);
    }
  });
});
