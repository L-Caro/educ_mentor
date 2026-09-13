import type { TuileDragon, TuileFace, TuileValeurSimple, TuileVent } from './mahjong.types';

const VALEURS_SIMPLES: TuileValeurSimple[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];
const VENTS: TuileVent[] = ['est', 'sud', 'ouest', 'nord'];
const DRAGONS: TuileDragon[] = ['rouge', 'vert', 'blanc'];

const LIBELLES_VENTS: Record<TuileVent, string> = {
  est: 'est',
  sud: 'sud',
  ouest: 'ouest',
  nord: 'nord',
};

const LIBELLES_DRAGONS: Record<TuileDragon, string> = {
  rouge: 'rouge',
  vert: 'vert',
  blanc: 'blanc',
};

/**
 * Les 34 faces traditionnelles du Mahjong : bambous, cercles et caracteres de 1 a 9,
 * les 4 vents et les 3 dragons. Un jeu complet contient 4 exemplaires de chaque face
 * (136 tuiles) ; ce module ne modelise que les faces distinctes, la duplication et le
 * tirage au sort sont la responsabilite du plateau de jeu (EM-39 et suivants), pas du
 * set de tuiles.
 */
export function construireFaces(): TuileFace[] {
  return [
    ...VALEURS_SIMPLES.map((valeur): TuileFace => ({ famille: 'bambou', valeur })),
    ...VALEURS_SIMPLES.map((valeur): TuileFace => ({ famille: 'cercle', valeur })),
    ...VALEURS_SIMPLES.map((valeur): TuileFace => ({ famille: 'caractere', valeur })),
    ...VENTS.map((direction): TuileFace => ({ famille: 'vent', direction })),
    ...DRAGONS.map((couleur): TuileFace => ({ famille: 'dragon', couleur })),
  ];
}

/** Identifiant stable d'une face : sert de cle React et de comparaison de paires. */
export function identifiantFace(face: TuileFace): string {
  switch (face.famille) {
    case 'bambou':
    case 'cercle':
    case 'caractere':
      return `${face.famille}-${face.valeur}`;
    case 'vent':
      return `vent-${face.direction}`;
    case 'dragon':
      return `dragon-${face.couleur}`;
  }
}

/** Libelle francais accessible d'une face, utilise comme `aria-label` de la tuile. */
export function libelleFace(face: TuileFace): string {
  switch (face.famille) {
    case 'bambou':
      return `Bambou ${face.valeur}`;
    case 'cercle':
      return `Cercle ${face.valeur}`;
    case 'caractere':
      return `Caractere ${face.valeur}`;
    case 'vent':
      return `Vent ${LIBELLES_VENTS[face.direction]}`;
    case 'dragon':
      return `Dragon ${LIBELLES_DRAGONS[face.couleur]}`;
  }
}
