import {
  computeRetenues,
  generatePose,
  hasCarry,
  type PoseOperation,
} from './pose.generator';

/**
 * La difficulté d'une opération posée se joue entièrement ici : le nombre de chiffres et
 * la présence de retenues. Une soustraction qui passerait sous zéro, ou une « addition
 * avec retenue » qui n'en a pas, ne se verraient qu'en jouant — et fausseraient la
 * progression, puisque la clé de compétence dérive de ces mêmes contraintes.
 */

/** Le backend tourne sous jest : `expect` n'accepte pas de message en second argument,
 * contrairement à vitest côté frontend. */

/** Générateur déterministe : les tests ne doivent pas dépendre du hasard. */
function randSeq(valeurs: number[]) {
  let i = 0;
  return () => valeurs[i++ % valeurs.length];
}
const randReel = (min: number, max: number) =>
  Math.floor(Math.random() * (max - min + 1)) + min;

describe('hasCarry', () => {
  it('repère une retenue en addition', () => {
    expect(hasCarry('addition', 7, 5)).toBe(true); // 7 + 5 = 12
    expect(hasCarry('addition', 23, 45)).toBe(false); // 3+5=8, 2+4=6
    expect(hasCarry('addition', 28, 45)).toBe(true); // 8+5=13
  });

  it('repère un emprunt en soustraction', () => {
    expect(hasCarry('soustraction', 2847, 138)).toBe(true); // 7-8 impossible
    expect(hasCarry('soustraction', 58, 23)).toBe(false); // 8-3, 5-2
  });

  it('gère des opérandes de longueurs différentes', () => {
    expect(hasCarry('addition', 195, 7)).toBe(true);
    expect(hasCarry('soustraction', 100, 1)).toBe(true);
    expect(hasCarry('soustraction', 99, 1)).toBe(false);
  });
});

describe('generatePose', () => {
  const operations: PoseOperation[] = ['addition', 'soustraction'];

  it('respecte le nombre de chiffres demandé', () => {
    for (const operation of operations) {
      for (const digits of [1, 2, 3, 4]) {
        for (let n = 0; n < 40; n++) {
          const q = generatePose(operation, {
            digits,
            carry: 'any',
            rand: randReel,
          })!;
          expect(q).not.toBeNull();
          expect(String(Math.max(...q.operands)).length).toBe(digits);
        }
      }
    }
  });

  it('respecte la contrainte de retenue, dans les deux sens', () => {
    for (const operation of operations) {
      for (const carry of ['with', 'without'] as const) {
        for (let n = 0; n < 60; n++) {
          const q = generatePose(operation, {
            digits: 3,
            carry,
            rand: randReel,
          });
          if (!q) continue; // abandon assumé, testé plus bas
          expect(q.has_carry).toBe(carry === 'with');
        }
      }
    }
  });

  it('ne produit jamais de soustraction négative ni nulle', () => {
    for (let n = 0; n < 300; n++) {
      const q = generatePose('soustraction', {
        digits: 3,
        carry: 'any',
        rand: randReel,
      })!;
      expect(q.answer).toBeGreaterThan(0);
      expect(q.operands[0]).toBeGreaterThan(q.operands[1]);
    }
  });

  it('calcule un résultat juste et annonce la bonne longueur de saisie', () => {
    for (const operation of operations) {
      for (let n = 0; n < 200; n++) {
        const q = generatePose(operation, {
          digits: 3,
          carry: 'any',
          rand: randReel,
        })!;
        const [a, b] = q.operands;
        expect(q.answer).toBe(operation === 'addition' ? a + b : a - b);
        expect(q.answer_length).toBe(String(q.answer).length);
      }
    }
  });

  it('encode la difficulté réelle dans la clé de progression', () => {
    // Sans cela, réussir « 12 + 13 » compterait comme réussir « 287 + 456 ».
    const facile = generatePose('addition', {
      digits: 2,
      carry: 'without',
      rand: randReel,
    })!;
    const dur = generatePose('soustraction', {
      digits: 4,
      carry: 'with',
      rand: randReel,
    })!;
    expect(facile.skill_key).toBe('addition_2_simple');
    expect(dur.skill_key).toBe('soustraction_4_retenue');
  });

  it('abandonne proprement au lieu de boucler sur une contrainte impossible', () => {
    // Une soustraction à un chiffre AVEC retenue n'existe pas : a > b et a - b >= 0 par
    // construction. Le générateur doit rendre la main, pas tourner indéfiniment.
    const q = generatePose('soustraction', {
      digits: 1,
      carry: 'with',
      rand: randSeq([5, 3]),
    });
    expect(q).toBeNull();
  });
});

describe('computeRetenues', () => {
  /** Rend les marques comme on les lirait sur le cahier, de gauche à droite. */
  const lire = (m: (number | null)[]) =>
    [...m]
      .reverse()
      .map((v) => (v === null ? '.' : String(v)))
      .join(' ');

  describe('addition', () => {
    it('écrit la retenue au-dessus de la colonne suivante', () => {
      // 28 + 45 : 8+5=13, retenue de 1 au-dessus des dizaines.
      const r = computeRetenues('addition', 28, 45, 'compensation');
      expect(r.haut[1]).toBe(1);
      expect(r.haut[0]).toBeNull();
      expect(r.bas.every((x) => x === null)).toBe(true);
    });

    it('enchaîne les retenues successives', () => {
      // 99 + 99 : retenue aux dizaines ET aux centaines.
      const r = computeRetenues('addition', 99, 99, 'compensation');
      expect(r.haut[1]).toBe(1);
      expect(r.haut[2]).toBe(1);
    });

    it('ne marque rien quand il n’y a pas de retenue', () => {
      const r = computeRetenues('addition', 23, 45, 'compensation');
      expect(r.haut.every((x) => x === null)).toBe(true);
    });

    it('ignore la méthode : elle ne concerne que la soustraction', () => {
      const a = computeRetenues('addition', 28, 45, 'compensation');
      const b = computeRetenues('addition', 28, 45, 'cassage');
      expect(a).toEqual(b);
    });
  });

  describe('soustraction par compensation', () => {
    it("reproduit l'exemple du manuel : 2847 − 138", () => {
      // L'illustration montre 17 au-dessus du 7, et le 3 du bas devenu 4.
      const r = computeRetenues('soustraction', 2847, 138, 'compensation');
      expect(r.haut[0]).toBe(17);
      expect(r.bas[1]).toBe(4);
      expect(lire(r.haut)).toBe('. . . . 17');
      expect(lire(r.bas)).toBe('. . . 4 .');
    });

    it('propage la compensation sur plusieurs colonnes', () => {
      // 100 − 1 : impossible aux unités, puis aux dizaines.
      const r = computeRetenues('soustraction', 100, 1, 'compensation');
      expect(r.haut[0]).toBe(10);
      expect(r.bas[1]).toBe(1);
      expect(r.haut[1]).toBe(10);
      expect(r.bas[2]).toBe(1);
    });

    it('ne marque rien sans emprunt', () => {
      const r = computeRetenues('soustraction', 58, 23, 'compensation');
      expect(r.haut.every((x) => x === null)).toBe(true);
      expect(r.bas.every((x) => x === null)).toBe(true);
    });
  });

  describe('soustraction par cassage', () => {
    it('barre le chiffre du haut au lieu d’ajouter en bas', () => {
      // 2847 − 138 : le 7 devient 17, le 4 devient 3. Rien en bas.
      const r = computeRetenues('soustraction', 2847, 138, 'cassage');
      expect(r.haut[0]).toBe(17);
      expect(r.haut[1]).toBe(3);
      expect(r.bas.every((x) => x === null)).toBe(true);
    });

    it('enchaîne les emprunts', () => {
      // 100 − 1 : on casse en cascade.
      const r = computeRetenues('soustraction', 100, 1, 'cassage');
      expect(r.haut[0]).toBe(10);
      expect(r.haut[1]).toBe(9);
      expect(r.bas.every((x) => x === null)).toBe(true);
    });
  });

  it('les deux méthodes donnent le même résultat, jamais la même écriture', () => {
    // C'est toute la raison du réglage : le calcul est identique, la trace écrite non.
    for (const [a, b] of [
      [2847, 138],
      [100, 1],
      [503, 47],
      [1000, 999],
    ]) {
      const comp = computeRetenues('soustraction', a, b, 'compensation');
      const cass = computeRetenues('soustraction', a, b, 'cassage');
      expect(comp).not.toEqual(cass);
      // La compensation écrit en bas, le cassage jamais.
      expect(comp.bas.some((x) => x !== null)).toBe(true);
      expect(cass.bas.every((x) => x === null)).toBe(true);
    }
  });
});
