import { describe, expect, it } from 'vitest';
import { construireFaces, identifiantFace, libelleFace } from 'src/modules/mahjong/tuiles';
import { cheminImageFace } from 'src/modules/mahjong/tuiles-images';
import type { TuileFamille } from 'src/modules/mahjong/mahjong.types';

function compterParFamille(): Record<TuileFamille, number> {
  const compte: Record<TuileFamille, number> = {
    bambou: 0,
    cercle: 0,
    caractere: 0,
    vent: 0,
    dragon: 0,
  };
  for (const face of construireFaces()) compte[face.famille]++;
  return compte;
}

describe('construireFaces', () => {
  it('produit les 34 faces traditionnelles', () => {
    expect(construireFaces()).toHaveLength(34);
  });

  it('repartit les faces selon les familles reelles du Mahjong', () => {
    expect(compterParFamille()).toEqual({
      bambou: 9,
      cercle: 9,
      caractere: 9,
      vent: 4,
      dragon: 3,
    });
  });

  it("n'a aucune face en double", () => {
    const identifiants = construireFaces().map(identifiantFace);
    expect(new Set(identifiants).size).toBe(identifiants.length);
  });
});

describe('libelleFace', () => {
  it('decrit chaque famille en francais', () => {
    expect(libelleFace({ famille: 'bambou', valeur: 3 })).toBe('Bambou 3');
    expect(libelleFace({ famille: 'cercle', valeur: 7 })).toBe('Cercle 7');
    expect(libelleFace({ famille: 'caractere', valeur: 1 })).toBe('Caractere 1');
    expect(libelleFace({ famille: 'vent', direction: 'nord' })).toBe('Vent nord');
    expect(libelleFace({ famille: 'dragon', couleur: 'blanc' })).toBe('Dragon blanc');
  });
});

describe('cheminImageFace', () => {
  it('trouve une image pour chacune des 34 faces (aucun trou dans le mappage)', () => {
    for (const face of construireFaces()) {
      expect(() => cheminImageFace(face)).not.toThrow();
      expect(cheminImageFace(face)).toBeTruthy();
    }
  });
});
