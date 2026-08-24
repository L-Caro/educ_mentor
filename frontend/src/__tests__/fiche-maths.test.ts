import { describe, expect, it } from 'vitest';
import { calculFiche, kindOf } from 'src/modules/calcul/calcul.fiche';
import { heureFiche, lireEnExpression } from 'src/modules/heure/heure.fiche';
import { monnaieFiche } from 'src/modules/monnaie/monnaie.fiche';
import { numerationFiche } from 'src/modules/numeration/numeration.fiche';
import type { MonnaieQuestion } from 'src/modules/monnaie/monnaie.type';
import type { NumerationQuestion } from 'src/modules/numeration/numeration.type';
import type { Fiche } from 'src/types/fiche.types';

/** Aucune fiche ne doit employer de cadratin dans le texte affiché (cf. frontend/CLAUDE.md). */
function assertPropre(f: Fiche) {
  const regle = Array.isArray(f.regle) ? f.regle.join(' ') : (f.regle ?? '');
  for (const texte of [f.titre, f.idee, regle, f.piege ?? '']) {
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
  const q = (hour: number, minute: number, mode: 'digital' | 'expression' = 'digital') =>
    ({
      hour, minute, answer_value: hour * 60 + minute,
      numeral_type: 'arabic' as const, choices: [], questionMode: mode,
    });

  const regleDe = (f: Fiche) => (Array.isArray(f.regle) ? f.regle.join(' | ') : f.regle ?? '');

  describe('mode expression', () => {
    it("annonce l'heure d'après passé la demie", () => {
      // Le cas qui a motivé cette réécriture : la fiche donnait « 3 heures 50 » quand la
      // réponse attendue était « quatre heures moins dix ».
      expect(lireEnExpression(3, 50).dite).toBe('4 heures moins dix');
      expect(lireEnExpression(3, 40).dite).toBe('4 heures moins vingt');
      expect(lireEnExpression(3, 45).dite).toBe('4 heures moins le quart');
    });

    it('nomme les repères avant la demie', () => {
      expect(lireEnExpression(3, 0).dite).toBe('3 heures pile');
      expect(lireEnExpression(3, 15).dite).toBe('3 heures et quart');
      expect(lireEnExpression(3, 30).dite).toBe('3 heures et demie');
      expect(lireEnExpression(7, 20).dite).toBe('7 heures vingt');
    });

    it('accorde « heure » au singulier', () => {
      expect(lireEnExpression(12, 50).dite).toBe('1 heure moins dix');
    });

    it('repasse à 12 après 23h', () => {
      expect(lireEnExpression(23, 55).dite).toBe('12 heures moins cinq');
    });

    it('explique le calcul à rebours, pas la lecture digitale', () => {
      const f = heureFiche(q(3, 50, 'expression'));
      expect(regleDe(f)).toContain('4 heures moins dix');
      expect(regleDe(f)).not.toContain('3 heures 50');
      expect(f.idee).toContain("l'heure d'après");
      expect(f.piege).toContain('annonce 4');
    });

    it("ne parle pas d'heure d'après avant la demie", () => {
      const f = heureFiche(q(3, 20, 'expression'));
      expect(f.piege).toBeUndefined();
      expect(f.idee).toContain('Avant la demie');
    });
  });

  describe('mode digital', () => {
    it('lit les minutes telles quelles', () => {
      expect(regleDe(heureFiche(q(3, 50)))).toContain('3 heures 50');
    });

    it("traduit les heures de l'après-midi", () => {
      const f = heureFiche(q(15, 20));
      expect(regleDe(f)).toContain('3 heures');
      expect(regleDe(f)).toContain("l'après-midi");
    });

    it('conseille de compter les petits traits hors des multiples de 5', () => {
      expect(heureFiche(q(4, 23)).idee).toContain('un par un');
    });
  });

  it('reste propre sur les 24 heures, dans les deux modes', () => {
    for (const mode of ['digital', 'expression'] as const) {
      for (let h = 0; h < 24; h++) {
        for (const m of [0, 7, 15, 30, 40, 45, 50, 59]) assertPropre(heureFiche(q(h, m, mode)));
      }
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

  it('empile les rangs, du plus grand au plus petit', () => {
    // Le serveur envoie les rangs MÉLANGÉS (voulu : l'enfant doit réfléchir à quel rang va
    // où). Repris tels quels, six rangs sur une ligne débordaient et devenaient illisibles.
    const f = numerationFiche(q({
      type: 'decomposition',
      decompose_positions: ['cm', 'd', 'dm', 'm', 'c', 'u'],
      answer: '8:2:3:4:0:6',
    }));
    expect(f.regle).toEqual([
      '  8 centaines de milliers',
      '+ 3 dizaines de milliers',
      '+ 4 milliers',
      '+ 0 centaines',
      '+ 2 dizaines',
      '+ 6 unités',
    ]);
  });

  it('empile aussi la valeur positionnelle', () => {
    const f = numerationFiche(q({ type: 'valeur_positionnelle', display: '3 405', answer: '4' }));
    expect(Array.isArray(f.regle)).toBe(true);
    expect((f.regle as string[]).length).toBe(2);
  });

  it('couvre les quatre types sans trou', () => {
    for (const type of ['comparaison', 'suite', 'decomposition', 'valeur_positionnelle'] as const) {
      const f = numerationFiche(q({ type, suite_terms: [2, 4], decompose_positions: ['u'], answer: '2' }));
      expect(f).toBeDefined();
      assertPropre(f);
    }
  });
});
