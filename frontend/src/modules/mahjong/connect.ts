import type { TuileJeu } from './moteur';
import { identifiantFace } from './tuiles';

export interface Position {
  ligne: number;
  colonne: number;
}

/** Grille du mode Moyen : `null` = case vide (tuile retiree, ou jamais posee). */
export type GrilleConnect = (TuileJeu | null)[][];

/**
 * Dimensions d'une grille rectangulaire pour `nombreTuiles` tuiles, plus large que haute.
 * Le nombre de tuiles n'a pas toujours un diviseur proche d'un carre (34 paires = 68
 * tuiles = 4 x 17) : la grille peut donc contenir quelques cases vides des le depart, ce
 * qui degage au passage un peu d'espace pour tracer des chemins.
 */
export function dimensionsGrille(nombreTuiles: number): { lignes: number; colonnes: number } {
  const colonnes = Math.max(2, Math.round(Math.sqrt(nombreTuiles * 1.4)));
  const lignes = Math.ceil(nombreTuiles / colonnes);
  return { lignes, colonnes };
}

/** Place des tuiles deja tirees et melangees dans une grille rectangulaire, les cases en
 * trop restant vides. */
export function construireGrilleConnect(tuiles: TuileJeu[]): GrilleConnect {
  const { lignes, colonnes } = dimensionsGrille(tuiles.length);
  const grille: GrilleConnect = Array.from({ length: lignes }, () => Array(colonnes).fill(null));
  tuiles.forEach((tuile, index) => {
    grille[Math.floor(index / colonnes)][index % colonnes] = tuile;
  });
  return grille;
}

function memePosition(a: Position, b: Position): boolean {
  return a.ligne === b.ligne && a.colonne === b.colonne;
}

/** Une case hors grille est toujours franchissable : c'est ce qui permet au chemin de
 * sortir du plateau pour relier deux tuiles du bord, comme dans un vrai Mahjong Connect. */
function estFranchissable(grille: GrilleConnect, position: Position): boolean {
  const { ligne, colonne } = position;
  if (ligne < 0 || ligne >= grille.length) return true;
  if (colonne < 0 || colonne >= grille[0].length) return true;
  return grille[ligne][colonne] === null;
}

/**
 * Segment droit (horizontal ou vertical) sans aucune tuile strictement entre les deux
 * extremites. Les extremites elles-memes ne sont jamais verifiees ici : ce sont souvent
 * les deux tuiles qu'on cherche a relier, donc jamais vides, et c'est a l'appelant de
 * decider si un point de coude doit l'etre.
 */
function segmentDegage(grille: GrilleConnect, a: Position, b: Position): boolean {
  if (a.ligne === b.ligne) {
    const debut = Math.min(a.colonne, b.colonne);
    const fin = Math.max(a.colonne, b.colonne);
    for (let colonne = debut + 1; colonne < fin; colonne++) {
      if (!estFranchissable(grille, { ligne: a.ligne, colonne })) return false;
    }
    return true;
  }
  if (a.colonne === b.colonne) {
    const debut = Math.min(a.ligne, b.ligne);
    const fin = Math.max(a.ligne, b.ligne);
    for (let ligne = debut + 1; ligne < fin; ligne++) {
      if (!estFranchissable(grille, { ligne, colonne: a.colonne })) return false;
    }
    return true;
  }
  return false;
}

/**
 * Un chemin existe entre deux tuiles s'il les relie en au plus deux coudes (trois segments
 * droits), sans jamais traverser une autre tuile. Le chemin peut sortir de la grille, ce
 * qui permet de relier deux tuiles du bord en passant par l'exterieur.
 *
 * - Aucun coude : meme ligne ou meme colonne, rien entre les deux.
 * - Un coude : un des deux coins du rectangle a/b est libre, et chaque moitie est degagee.
 * - Deux coudes : une ligne (ou colonne) intermediaire, y compris juste hors grille, relie
 *   la colonne de `a` a la colonne de `b` (ou la ligne de `a` a la ligne de `b`).
 */
export function cheminExiste(grille: GrilleConnect, a: Position, b: Position): boolean {
  if (memePosition(a, b)) return false;

  if ((a.ligne === b.ligne || a.colonne === b.colonne) && segmentDegage(grille, a, b)) {
    return true;
  }

  const coins: Position[] = [
    { ligne: a.ligne, colonne: b.colonne },
    { ligne: b.ligne, colonne: a.colonne },
  ];
  for (const coin of coins) {
    if (
      estFranchissable(grille, coin) &&
      segmentDegage(grille, a, coin) &&
      segmentDegage(grille, coin, b)
    ) {
      return true;
    }
  }

  const lignes = grille.length;
  const colonnes = grille[0]?.length ?? 0;

  for (let ligne = -1; ligne <= lignes; ligne++) {
    const p1: Position = { ligne, colonne: a.colonne };
    const p2: Position = { ligne, colonne: b.colonne };
    if (!estFranchissable(grille, p1) && !memePosition(p1, a)) continue;
    if (!estFranchissable(grille, p2) && !memePosition(p2, b)) continue;
    if (segmentDegage(grille, a, p1) && segmentDegage(grille, p1, p2) && segmentDegage(grille, p2, b)) {
      return true;
    }
  }

  for (let colonne = -1; colonne <= colonnes; colonne++) {
    const p1: Position = { ligne: a.ligne, colonne };
    const p2: Position = { ligne: b.ligne, colonne };
    if (!estFranchissable(grille, p1) && !memePosition(p1, a)) continue;
    if (!estFranchissable(grille, p2) && !memePosition(p2, b)) continue;
    if (segmentDegage(grille, a, p1) && segmentDegage(grille, p1, p2) && segmentDegage(grille, p2, b)) {
      return true;
    }
  }

  return false;
}

/**
 * Tente d'apparier deux cases de la grille : memes faces, et un chemin les relie. Ne
 * modifie rien si le pari echoue (mauvaise face ou aucun chemin).
 */
export function tenterAppariementConnect(
  grille: GrilleConnect,
  a: Position,
  b: Position,
): { reussi: boolean; grille: GrilleConnect } {
  const tuileA = grille[a.ligne]?.[a.colonne];
  const tuileB = grille[b.ligne]?.[b.colonne];
  if (!tuileA || !tuileB || memePosition(a, b)) return { reussi: false, grille };
  if (identifiantFace(tuileA.face) !== identifiantFace(tuileB.face)) return { reussi: false, grille };
  if (!cheminExiste(grille, a, b)) return { reussi: false, grille };

  const grilleSuivante = grille.map((ligne) => [...ligne]);
  grilleSuivante[a.ligne][a.colonne] = null;
  grilleSuivante[b.ligne][b.colonne] = null;
  return { reussi: true, grille: grilleSuivante };
}
