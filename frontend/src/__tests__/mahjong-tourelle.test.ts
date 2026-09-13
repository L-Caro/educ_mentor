import { describe, expect, it } from 'vitest';
import {
  estLibre,
  formeEstValide,
  genererDispositionTourelle,
  genererPlateauTourelle,
  tenterAppariementTourelle,
  type CaseTourelle,
  type PositionTourelle,
} from 'src/modules/mahjong/tourelle';
import { FORMES, trouverForme } from 'src/modules/mahjong/formes';
import { identifiantFace } from 'src/modules/mahjong/tuiles';

describe('les dix dispositions importees (voir ATTRIBUTIONS.md)', () => {
  it('ont chacune 144 tuiles (un jeu complet)', () => {
    for (const forme of FORMES) {
      expect({ id: forme.id, n: forme.slots.length }).toEqual({ id: forme.id, n: 144 });
    }
  });

  it("n'ont aucune tuile flottante (chaque etage > 0 repose sur l'etage du dessous)", () => {
    for (const forme of FORMES) {
      expect({ id: forme.id, valide: formeEstValide(forme.slots) }).toEqual({
        id: forme.id,
        valide: true,
      });
    }
  });

  it('trouverForme retombe sur la tortue pour un id absent ou invalide', () => {
    expect(trouverForme(undefined).id).toBe('turtle_classic');
    expect(trouverForme('inconnue').id).toBe('turtle_classic');
  });
});

describe('estLibre', () => {
  it("est libre quand rien n'est au-dessus et qu'un cote au moins est degage", () => {
    const position: PositionTourelle = { x: 0, y: 0, z: 0 };
    expect(estLibre([], position)).toBe(true);
  });

  it("n'est pas libre si une tuile chevauche par-dessus", () => {
    const position: PositionTourelle = { x: 0, y: 0, z: 0 };
    const dessus: PositionTourelle = { x: 0, y: 0, z: 1 };
    expect(estLibre([dessus], position)).toBe(false);
  });

  it('un chevauchement partiel au-dessus bloque aussi (tuile a moitie sur deux)', () => {
    const position: PositionTourelle = { x: 0, y: 0, z: 0 };
    // Chevauche seulement la moitie droite de `position` (x commun a [0,1)), donc bloque.
    const dessus: PositionTourelle = { x: 1, y: 0, z: 1 };
    expect(estLibre([dessus], position)).toBe(false);
  });

  it("n'est pas libre si les deux cotes sont occupes", () => {
    const position: PositionTourelle = { x: 2, y: 0, z: 0 };
    const gauche: PositionTourelle = { x: 0, y: 0, z: 0 };
    const droite: PositionTourelle = { x: 4, y: 0, z: 0 };
    expect(estLibre([gauche, droite], position)).toBe(false);
  });

  it('reste libre si un seul cote est occupe', () => {
    const position: PositionTourelle = { x: 2, y: 0, z: 0 };
    const gauche: PositionTourelle = { x: 0, y: 0, z: 0 };
    expect(estLibre([gauche], position)).toBe(true);
  });

  it('ignore ce qui se trouve en dessous', () => {
    const position: PositionTourelle = { x: 0, y: 0, z: 1 };
    const dessous: PositionTourelle = { x: 0, y: 0, z: 0 };
    expect(estLibre([dessous], position)).toBe(true);
  });
});

describe('genererDispositionTourelle', () => {
  it('couvre chaque position de la forme exactement une fois', () => {
    const forme = trouverForme('pyramid').slots;
    const paires = genererDispositionTourelle(forme);
    const positionsUtilisees = paires.flat();
    expect(positionsUtilisees).toHaveLength(forme.length);
    expect(new Set(positionsUtilisees)).toEqual(new Set(forme));
  });

  it('produit un plateau reellement solvable de bout en bout, sur une vraie disposition', () => {
    // `paires` est deja dans l'ordre de retrait (la construction simule une vraie partie
    // en avant, voir tourelle.ts) : pas besoin de l'inverser.
    for (const id of ['turtle_classic', 'pyramid', 'fortress']) {
      const forme = trouverForme(id).slots;
      const paires = genererDispositionTourelle(forme);

      let plateau: PositionTourelle[] = forme;
      for (const [positionA, positionB] of paires) {
        expect(estLibre(plateau, positionA)).toBe(true);
        expect(estLibre(plateau, positionB)).toBe(true);
        plateau = plateau.filter((position) => position !== positionA && position !== positionB);
      }
      expect(plateau).toHaveLength(0);
    }
  });
});

describe('genererPlateauTourelle', () => {
  it('produit 144 tuiles, chaque face en nombre pair', () => {
    const cases = genererPlateauTourelle(trouverForme('turtle_classic'));
    expect(cases).toHaveLength(144);

    const occurrences = new Map<string, number>();
    for (const caseTourelle of cases) {
      const identifiant = identifiantFace(caseTourelle.tuile.face);
      occurrences.set(identifiant, (occurrences.get(identifiant) ?? 0) + 1);
    }
    for (const compte of occurrences.values()) {
      expect(compte % 2).toBe(0);
    }
    expect([...occurrences.values()].reduce((total, compte) => total + compte, 0)).toBe(144);
  });
});

describe('tenterAppariementTourelle', () => {
  const faceCommune = { famille: 'bambou' as const, valeur: 1 as const };
  const cases: CaseTourelle[] = [
    { x: 0, y: 0, z: 0, tuile: { id: 'a', face: faceCommune } },
    { x: 10, y: 0, z: 0, tuile: { id: 'b', face: faceCommune } },
    { x: 0, y: 0, z: 1, tuile: { id: 'c', face: { famille: 'cercle', valeur: 2 } } },
  ];

  it('echoue si une des deux tuiles est verrouillee (une autre est posee dessus)', () => {
    const resultat = tenterAppariementTourelle(cases, 'a', 'b');
    expect(resultat.reussi).toBe(false);
    expect(resultat.cases).toBe(cases);
  });

  it('retire les deux tuiles quand elles sont libres et de meme face', () => {
    const casesSansC = cases.filter((c) => c.tuile.id !== 'c');
    const resultat = tenterAppariementTourelle(casesSansC, 'a', 'b');
    expect(resultat.reussi).toBe(true);
    expect(resultat.cases).toHaveLength(0);
  });
});
