import { describe, expect, it } from 'vitest';
import { tablesGameSpec } from 'src/modules/tables/tables.game';
import type { TablesQuestion } from 'src/modules/tables/tables.type';

/**
 * Deuxième module à déclarer une fiche, et celui qui vérifie que le contrat se généralise :
 * contrairement à la conjugaison, tables n'a demandé AUCUNE modification du backend — tout
 * était déjà dans la question.
 */

const q = (a: number, b: number): TablesQuestion => ({
  fact_id: `${a}x${b}`,
  display_a: a,
  display_b: b,
  answer: a * b,
  choices: [],
});

describe('fiche des tables', () => {
  const fiche = tablesGameSpec.fiche!;

  it('récite toujours la table du plus PETIT facteur', () => {
    // 7 × 8 comme 8 × 7 renvoient à la table de 7 : c'est celle qu'on apprend,
    // et c'est ce qui rend l'idée de commutativité utile plutôt que théorique.
    expect(fiche(q(8, 7))!.regle).toBe('7 × 8 = 56');
    expect(fiche(q(7, 8))!.regle).toBe('7 × 8 = 56');
  });

  it('garde le titre dans le sens où la question a été posée', () => {
    expect(fiche(q(8, 7))!.titre).toBe('8 × 7');
    expect(fiche(q(7, 8))!.titre).toBe('7 × 8');
  });

  it('énonce la commutativité comme idée clé', () => {
    const f = fiche(q(3, 9))!;
    expect(f.idee).toContain('3 × 9');
    expect(f.idee).toContain('9 × 3');
  });

  it('signale les cas particuliers 0 et 1, et rien ailleurs', () => {
    expect(fiche(q(0, 6))!.piege).toContain('0');
    expect(fiche(q(1, 6))!.piege).toContain('1');
    expect(fiche(q(4, 6))!.piege).toBeUndefined();
  });

  it('est pure sur toute la table de multiplication', () => {
    for (let a = 0; a <= 10; a++) {
      for (let b = 0; b <= 10; b++) {
        const first = fiche(q(a, b))!;
        const second = fiche(q(a, b))!;
        expect(first.regle).toBe(second.regle);
        expect(first.regle).toContain(String(a * b));
      }
    }
  });
});
