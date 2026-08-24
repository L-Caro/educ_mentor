import { describe, expect, it } from 'vitest';
import { poseFiche } from 'src/modules/pose/pose.fiche';
import type { PoseQuestion } from 'src/modules/pose/pose.type';

const q = (over: Partial<PoseQuestion> = {}): PoseQuestion => ({
  skill_key: 'soustraction_4_retenue',
  operation: 'soustraction',
  operands: [4994, 4185],
  answer: 809,
  answer_length: 3,
  columns: 5,
  has_carry: true,
  retenues: { haut: [14, null, null, null, null], bas: [null, 9, null, null, null] },
  carry_display: 'empty',
  ...over,
});

describe('fiche du calcul posé', () => {
  it("montre l'opération posée plutôt que de la décrire", () => {
    // Une version en texte monospace obligeait à compter les espaces à la main, ce qui
    // était faux, et le trait dessiné en caractères se lisait comme un cadratin.
    const f = poseFiche(q());
    expect(f.exemple).toBeDefined();
    expect(f.regle).toBeUndefined();
  });

  it("n'emploie ni cadratin ni caractère de dessin dans le texte", () => {
    for (const question of [q(), q({ operation: 'addition', has_carry: false })]) {
      const f = poseFiche(question);
      for (const texte of [f.titre, f.idee, f.piege ?? '']) {
        expect(texte).not.toMatch(/[—─▔]/);
      }
    }
  });

  it("rappelle l'ordre des gestes, différent selon l'opération", () => {
    expect(poseFiche(q({ operation: 'addition' })).idee).toContain('dépasse 9');
    expect(poseFiche(q()).idee).toContain('emprunte');
  });

  it('annonce la présence ou l’absence de retenue', () => {
    expect(poseFiche(q({ has_carry: true })).piege).toContain('une retenue');
    expect(poseFiche(q({ has_carry: false })).piege).toContain('aucune retenue');
  });

  it('titre avec le signe de l’opération, pas un tiret quelconque', () => {
    expect(poseFiche(q()).titre).toBe('4994 − 4185');
    expect(poseFiche(q({ operation: 'addition' })).titre).toBe('4994 + 4185');
  });
});
