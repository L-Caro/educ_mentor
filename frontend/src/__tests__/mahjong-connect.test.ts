import { describe, expect, it } from 'vitest';
import {
  cheminExiste,
  construireGrilleConnect,
  dimensionsGrille,
  tenterAppariementConnect,
  type GrilleConnect,
  type Position,
} from 'src/modules/mahjong/connect';
import type { TuileJeu } from 'src/modules/mahjong/moteur';
import type { TuileFace } from 'src/modules/mahjong/mahjong.types';

const FACE_QUELCONQUE: TuileFace = { famille: 'bambou', valeur: 1 };
const FACE_AUTRE: TuileFace = { famille: 'cercle', valeur: 5 };

/** Construit une grille depuis un schema texte : `.` case vide, `A`/`B` les deux tuiles
 * dont on cherche le chemin, toute autre lettre une tuile obstacle quelconque. Repere au
 * passage les positions de A et B, comme `grille()` dans les tests du morpion. */
function grilleDepuisTexte(lignesTexte: string[]): { grille: GrilleConnect; a: Position; b: Position } {
  let a: Position | null = null;
  let b: Position | null = null;
  const grille: GrilleConnect = lignesTexte.map((ligneTexte, ligne) =>
    [...ligneTexte].map((caractere, colonne): TuileJeu | null => {
      if (caractere === '.') return null;
      if (caractere === 'A') a = { ligne, colonne };
      if (caractere === 'B') b = { ligne, colonne };
      return { id: caractere, face: FACE_QUELCONQUE };
    }),
  );
  if (!a || !b) throw new Error('grille de test sans A et B');
  return { grille, a, b };
}

describe('dimensionsGrille', () => {
  it('produit une grille assez grande pour contenir toutes les tuiles', () => {
    for (const nombreTuiles of [8, 12, 16, 24, 36, 68]) {
      const { lignes, colonnes } = dimensionsGrille(nombreTuiles);
      expect(lignes * colonnes).toBeGreaterThanOrEqual(nombreTuiles);
    }
  });

  it('prefere une grille plus large que haute', () => {
    const { lignes, colonnes } = dimensionsGrille(24);
    expect(colonnes).toBeGreaterThanOrEqual(lignes);
  });
});

describe('construireGrilleConnect', () => {
  it('place exactement les tuiles fournies, le reste des cases restant vide', () => {
    const tuiles: TuileJeu[] = Array.from({ length: 12 }, (_, index) => ({
      id: `t${index}`,
      face: FACE_QUELCONQUE,
    }));
    const grille = construireGrilleConnect(tuiles);

    const idsPlaces = grille.flat().filter((tuile) => tuile !== null).map((tuile) => tuile!.id);
    expect(new Set(idsPlaces)).toEqual(new Set(tuiles.map((tuile) => tuile.id)));
  });
});

describe('cheminExiste', () => {
  it('relie deux tuiles de la meme ligne, sans rien entre elles', () => {
    const { grille, a, b } = grilleDepuisTexte(['A..B']);
    expect(cheminExiste(grille, a, b)).toBe(true);
  });

  it('relie deux tuiles avec un seul coude, par un coin degage', () => {
    const { grille, a, b } = grilleDepuisTexte(['A.', '.B']);
    expect(cheminExiste(grille, a, b)).toBe(true);
  });

  it('relie deux tuiles avec deux coudes, par une ligne intermediaire interne', () => {
    // Les deux coins directs (0,2) et (2,0) sont bloques : le seul chemin passe par la
    // ligne du milieu, entierement degagee, avec un coude a chaque bout.
    const { grille, a, b } = grilleDepuisTexte(['A.X', '...', 'X.B']);
    expect(cheminExiste(grille, a, b)).toBe(true);
  });

  it("ne trouve aucun chemin quand une tuile est completement encerclee", () => {
    // A n'a aucune sortie (les quatre cases orthogonales sont occupees) : aucun chemin,
    // quel que soit l'endroit ou se trouve B.
    const { grille, a, b } = grilleDepuisTexte(['.X..', 'XAX.', '.X.B']);
    expect(cheminExiste(grille, a, b)).toBe(false);
  });

  it('ne relie jamais une tuile a elle-meme', () => {
    const { grille, a } = grilleDepuisTexte(['A.B']);
    expect(cheminExiste(grille, a, a)).toBe(false);
  });
});

describe('tenterAppariementConnect', () => {
  it('retire les deux cases quand les faces correspondent et un chemin existe', () => {
    const grille: GrilleConnect = [
      [{ id: 'a', face: FACE_QUELCONQUE }, null, { id: 'b', face: FACE_QUELCONQUE }],
    ];
    const resultat = tenterAppariementConnect(grille, { ligne: 0, colonne: 0 }, { ligne: 0, colonne: 2 });
    expect(resultat.reussi).toBe(true);
    expect(resultat.grille[0]).toEqual([null, null, null]);
  });

  it('echoue si les faces ne correspondent pas, meme avec un chemin degage', () => {
    const grille: GrilleConnect = [
      [{ id: 'a', face: FACE_QUELCONQUE }, null, { id: 'b', face: FACE_AUTRE }],
    ];
    const resultat = tenterAppariementConnect(grille, { ligne: 0, colonne: 0 }, { ligne: 0, colonne: 2 });
    expect(resultat.reussi).toBe(false);
    expect(resultat.grille).toBe(grille);
  });

  it('echoue si les faces correspondent mais qu aucun chemin ne les relie', () => {
    const { grille, a, b } = grilleDepuisTexte(['.X..', 'XAX.', '.X.B']);
    const resultat = tenterAppariementConnect(grille, a, b);
    expect(resultat.reussi).toBe(false);
  });
});
