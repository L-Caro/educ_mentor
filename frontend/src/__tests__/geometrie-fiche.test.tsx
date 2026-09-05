import { describe, expect, it } from 'vitest';
import { geometrieFiche } from 'src/modules/geometrie/geometrie.fiche';
import type { GeometrieQuestion, ShapeMeta } from 'src/modules/geometrie/geometrie.type';

/**
 * La fiche de géométrie est DÉRIVÉE des métadonnées de forme attachées à la question
 * (`shape_meta`/`shape_b_meta`), jamais rédigée à l'avance par forme : le backend et le
 * front partagent la même source (`geometrie.shapes.ts`), la fiche n'invente rien.
 */

const carre: ShapeMeta = {
  key: 'carre', nom: 'carré', famille: 'quadrilatere', type: 'plane',
  cotes: 4, sommets: 4, angleDroit: true, cotesEgaux: true, faces: null, aretes: null,
  defaultActive: true,
};

const losange: ShapeMeta = {
  key: 'losange', nom: 'losange', famille: 'quadrilatere', type: 'plane',
  cotes: 4, sommets: 4, angleDroit: false, cotesEgaux: true, faces: null, aretes: null,
  defaultActive: false,
};

const cube: ShapeMeta = {
  key: 'cube', nom: 'cube', famille: 'solide', type: 'solide',
  cotes: null, sommets: 8, angleDroit: null, cotesEgaux: null, faces: 6, aretes: 12,
  defaultActive: true,
};

const question = (over: Partial<GeometrieQuestion> = {}): GeometrieQuestion => ({
  item_key: 'k', type: 'nom_figure', skill_key: 'carre', display: 'Comment s\'appelle cette figure ?',
  shape: 'carre', shapeB: null, shape_meta: carre, shape_b_meta: null,
  choices: [], answer: 'carré',
  ...over,
});

describe('fiche de géométrie : forme seule', () => {
  it('porte le nom de la forme en titre', () => {
    expect(geometrieFiche(question()).titre).toBe('carré');
  });

  it('liste ses propriétés dans la règle', () => {
    const regle = geometrieFiche(question()).regle;
    expect(regle?.[0]).toContain('4 côtés');
    expect(regle?.[0]).toContain('angle droit');
  });

  it('adapte l’idée clé à la famille (solide vs quadrilatère)', () => {
    const q = question({ type: 'nom_solide', skill_key: 'cube', shape: 'cube', shape_meta: cube });
    expect(geometrieFiche(q).idee).toContain('faces');
    expect(geometrieFiche(question()).idee).toContain('quadrilatère');
  });

  it("n'emploie aucun cadratin dans le texte affiché", () => {
    const f = geometrieFiche(question());
    for (const texte of [f.titre, f.idee, ...(f.regle ?? [])]) {
      expect(texte).not.toContain('—');
    }
  });
});

describe('fiche de géométrie : paire (proprietes)', () => {
  const q = question({
    type: 'proprietes',
    skill_key: 'carre_losange',
    shape: 'carre',
    shapeB: 'losange',
    shape_meta: carre,
    shape_b_meta: losange,
    choices: ['carré', 'losange'],
    answer: 'carré',
  });

  it('titre les deux formes', () => {
    const titre = geometrieFiche(q).titre;
    expect(titre).toContain('carré');
    expect(titre).toContain('losange');
  });

  it('donne une ligne de règle par forme, avec ce qui les distingue', () => {
    const regle = geometrieFiche(q).regle!;
    expect(regle).toHaveLength(2);
    expect(regle[0]).toContain('angle droit');
    expect(regle[1]).toContain('aucun angle droit');
  });
});
