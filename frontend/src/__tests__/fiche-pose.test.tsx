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
  method: 'compensation',
  partiels: [],
  retenues: { haut: [14, null, null, null, null], bas: [null, 9, null, null, null] },
  carry_display: 'empty',
  ...over,
});

describe('fiche du calcul posé', () => {
  it("montre l'opération posée plutôt que de la décrire", () => {
    // Une version en texte monospace obligeait à compter les espaces à la main, ce qui
    // était faux, et le trait dessiné en caractères se lisait comme un cadratin.
    expect(poseFiche(q()).exemple).toBeDefined();
  });

  it("n'énonce le geste que là où il y a une retenue à traiter", () => {
    expect(poseFiche(q({ has_carry: true })).regle).toBeDefined();
    expect(poseFiche(q({ has_carry: false })).regle).toBeUndefined();
  });

  it("n'emploie ni cadratin ni caractère de dessin dans le texte", () => {
    const cas = [
      q(),
      q({ method: 'cassage' }),
      q({ operation: 'addition' }),
      q({ operation: 'addition', has_carry: false }),
    ];
    for (const question of cas) {
      const f = poseFiche(question);
      const lignes = Array.isArray(f.regle) ? f.regle : [f.regle ?? ''];
      for (const texte of [f.titre, f.idee, f.piege ?? '', ...lignes]) {
        expect(texte).not.toMatch(/[—─▔]/);
      }
    }
  });

  it("n'emploie pas d'apostrophe typographique dans le texte affiché", () => {
    for (const question of [q(), q({ method: 'cassage' }), q({ operation: 'addition' })]) {
      const f = poseFiche(question);
      const lignes = Array.isArray(f.regle) ? f.regle : [f.regle ?? ''];
      for (const texte of [f.titre, f.idee, f.piege ?? '', ...lignes]) {
        expect(texte).not.toMatch(/’/);
      }
    }
  });

  it('décrit le geste de la méthode réglée, et pas celui de l’autre', () => {
    // Décrire la mauvaise méthode est pire que n'en décrire aucune : l'enfant croirait
    // s'être trompée en suivant sa maîtresse.
    const parCassage = [
      poseFiche(q({ method: 'cassage' })).idee,
      ...(poseFiche(q({ method: 'cassage' })).regle as string[]),
    ].join(' ');
    expect(parCassage).toContain('barre');
    expect(parCassage).not.toContain('en bas');

    const parCompensation = [
      poseFiche(q()).idee,
      ...(poseFiche(q()).regle as string[]),
    ].join(' ');
    expect(parCompensation).toContain('bas');
    expect(parCompensation).not.toContain('barre');
  });

  it('avertit de l’oubli propre à chaque méthode', () => {
    expect(poseFiche(q({ method: 'cassage' })).piege).toContain('chiffre barré');
    expect(poseFiche(q()).piege).toContain('BAS');
  });

  it("rappelle l'ordre des gestes, différent selon l'opération", () => {
    expect(poseFiche(q({ operation: 'addition' })).idee).toContain('dépasse 9');
    expect(poseFiche(q({ method: 'cassage' })).idee).toContain('emprunte');
  });

  it("signale une opération sans retenue plutôt que d'énoncer un geste inutile", () => {
    expect(poseFiche(q({ has_carry: false })).piege).toContain('aucune retenue');
  });

  it('titre avec le signe de l’opération, pas un tiret quelconque', () => {
    expect(poseFiche(q()).titre).toBe('4994 − 4185');
    expect(poseFiche(q({ operation: 'addition' })).titre).toBe('4994 + 4185');
  });
});
