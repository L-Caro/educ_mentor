import { DEFAULT_ACTIVE_SHAPES, SHAPES, getShape, isShapeKey } from './geometrie.shapes';

describe('geometrie.shapes', () => {
  it('isShapeKey reconnaît les clés déclarées et rejette le reste', () => {
    expect(isShapeKey('carre')).toBe(true);
    expect(isShapeKey('losange')).toBe(true);
    expect(isShapeKey('rhombus')).toBe(false);
    expect(isShapeKey(42)).toBe(false);
  });

  it('getShape renvoie la forme, ou explose sur une clé inconnue', () => {
    expect(getShape('cube').faces).toBe(6);
    expect(() => getShape('rhombus')).toThrow();
  });

  it("n'a pas deux formes avec la même clé", () => {
    const keys = SHAPES.map((shape) => shape.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('une figure plane porte côtés/sommets et jamais faces/arêtes, et réciproquement pour un solide', () => {
    for (const shape of SHAPES) {
      if (shape.type === 'plane') {
        expect(shape.faces).toBeNull();
        expect(shape.aretes).toBeNull();
        expect(shape.sommets).not.toBeNull();
      } else {
        expect(shape.cotes).toBeNull();
        expect(shape.angleDroit).toBeNull();
        expect(shape.cotesEgaux).toBeNull();
        expect(shape.faces).not.toBeNull();
      }
    }
  });

  it('le socle CE1 par défaut couvre les figures et solides les plus simples', () => {
    expect(DEFAULT_ACTIVE_SHAPES.sort()).toEqual(
      [
        'carre',
        'cercle',
        'cone',
        'cube',
        'pave',
        'pyramide',
        'rectangle',
        'triangle',
        'triangleRectangle',
      ].sort(),
    );
  });
});
