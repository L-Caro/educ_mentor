import { describe, expect, it } from 'vitest';
import {
  estLibre,
  melangerPlateau,
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

describe('melangerPlateau', () => {
  const plateau = () => genererPlateauTourelle(trouverForme('turtle_classic'));
  const cle = (c: { x: number; y: number; z: number }) => `${c.x},${c.y},${c.z}`;

  it('rebat les tuiles sans deplacer une seule POSITION', () => {
    // Melanger, ce n'est pas redistribuer le plateau : la forme reste celle que l'enfant
    // a devant les yeux, seules les faces changent de place.
    const avant = plateau();
    const apres = melangerPlateau(avant)!;
    expect(apres).not.toBeNull();
    expect(new Set(apres.map(cle))).toEqual(new Set(avant.map(cle)));
  });

  it('garde exactement les memes faces, en meme nombre', () => {
    // En perdre une rendrait la partie insoluble ; en ajouter une casserait le compte des
    // paires affiche a l'ecran.
    const avant = plateau();
    const apres = melangerPlateau(avant)!;
    const compter = (cases: typeof avant) => {
      const n = new Map<string, number>();
      for (const c of cases) {
        const k = identifiantFace(c.tuile.face);
        n.set(k, (n.get(k) ?? 0) + 1);
      }
      return [...n.entries()].sort();
    };
    expect(compter(apres)).toEqual(compter(avant));
  });

  it('rend un plateau OUVERT : au moins une paire jouable tout de suite', () => {
    // C'est la raison d'etre du melange. Permuter les faces au hasard peut rendre la main
    // sur un plateau mort des le premier coup ; on repasse donc par la construction a
    // l'envers, qui ne rend une disposition qu'apres l'avoir jouee entierement.
    for (let essai = 0; essai < 20; essai++) {
      const apres = melangerPlateau(plateau())!;
      const libres = apres.filter((c) => estLibre(apres, c));
      const paires = libres.some((a) =>
        libres.some((b) => a !== b && identifiantFace(a.tuile.face) === identifiantFace(b.tuile.face)),
      );
      expect(paires).toBe(true);
    }
  });

  it('marche AUSSI en cours de partie, pas seulement au depart', () => {
    // Le cas qui compte : c'est bloquee, au milieu, qu'on melange.
    let cases = plateau();
    for (let retire = 0; retire < 20 && cases.length > 4; retire++) {
      const libres = cases.filter((c) => estLibre(cases, c));
      const a = libres.find((x) =>
        libres.some((y) => y !== x && identifiantFace(x.tuile.face) === identifiantFace(y.tuile.face)),
      );
      if (!a) break;
      const b = libres.find(
        (y) => y !== a && identifiantFace(y.tuile.face) === identifiantFace(a.tuile.face),
      )!;
      cases = tenterAppariementTourelle(cases, a.tuile.id, b.tuile.id).cases;
    }
    const apres = melangerPlateau(cases)!;
    expect(apres).not.toBeNull();
    expect(apres).toHaveLength(cases.length);
  });

  it('refuse de melanger ce qui n’a plus rien a melanger', () => {
    expect(melangerPlateau([])).toBeNull();
  });
});
