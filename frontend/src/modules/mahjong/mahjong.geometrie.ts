import type { PositionTourelle } from './tourelle';

/**
 * La geometrie du plateau : des coordonnees en demi-unites vers des pixels.
 *
 * ── Pourquoi une projection OBLIQUE, et pas de la 3D ─────────────────────────────────
 *
 * Une premiere version posait une vraie scene 3D CSS (`perspective` + `rotateX(55deg)`,
 * un cube par tuile). Deux choses la condamnaient. La rotation ECRASE les faces
 * verticalement, donc les symboles, alors que c'est la seule chose que l'enfant doit
 * lire. Et le tri en profondeur revenait au navigateur, sur 144 elements quasi
 * coplanaires : c'est precisement le cas ou il n'est pas fiable.
 *
 * Un Mahjong Solitaire ne se dessine pas en perspective. C'est une projection oblique en
 * deux dimensions : aucune rotation, les faces restent des rectangles droits, et la
 * profondeur n'est qu'un DECALAGE constant. Les constantes ci-dessous sont celles du
 * projet d'ou viennent les dispositions (`ui/src/geometry.ts`, voir ATTRIBUTIONS.md) :
 * ce sont ses layouts, donc sa geometrie.
 *
 * ── La regle qui decide de tout ──────────────────────────────────────────────────────
 *
 * `EPAISSEUR` vaut `DECALAGE_ETAGE`, et ce n'est pas une coincidence a simplifier : le
 * cote d'une tuile doit combler exactement l'espace qui la separe de l'etage du dessous.
 * S'ils different, une pile cesse de ressembler a une colonne : soit les etages flottent,
 * soit ils s'enfoncent les uns dans les autres.
 */

/** Pixels par demi-unite. L'empreinte d'une tuile fait 2x2 demi-unites. */
export const DEMI_UNITE_X = 32;
export const DEMI_UNITE_Y = 42;
export const LARGEUR_TUILE = 2 * DEMI_UNITE_X;
export const HAUTEUR_TUILE = 2 * DEMI_UNITE_Y;

/** De combien un etage se decale : vers le HAUT et vers la GAUCHE. */
export const DECALAGE_ETAGE = 11;

/** Epaisseur du cote visible. Voir ci-dessus : la meme valeur, obligatoirement. */
export const EPAISSEUR = DECALAGE_ETAGE;

export interface Rectangle {
  x: number;
  y: number;
  largeur: number;
  hauteur: number;
}

/** Le rectangle de la face superieure, celle qu'on voit et qu'on touche. */
export function rectangleFace(position: PositionTourelle): Rectangle {
  return {
    x: position.x * DEMI_UNITE_X - position.z * DECALAGE_ETAGE,
    y: position.y * DEMI_UNITE_Y - position.z * DECALAGE_ETAGE,
    largeur: LARGEUR_TUILE,
    hauteur: HAUTEUR_TUILE,
  };
}

/**
 * L'ordre du peintre : du plus loin au plus proche.
 *
 * L'etage d'abord, puis les rangees de l'arriere vers l'avant, puis la gauche vers la
 * droite. Ce dernier terme n'est pas decoratif : les etages se decalent vers la gauche,
 * donc la camera est a DROITE, et dans une rangee la tuile la plus a droite est la plus
 * proche. Inverser ce signe fait que le cote de chaque tuile vient manger le bord de sa
 * voisine, alors qu'il est physiquement cache par elle.
 *
 * Un `z-index` plutot qu'un tri du tableau : l'ordre du DOM reste celui des tuiles, donc
 * stable pour React et pour la navigation au clavier, pendant que la superposition suit
 * la geometrie. Les coordonnees tiennent largement dans les paliers choisis (les
 * dispositions livrees vont jusqu'a 18 demi-unites en x et 20 en y).
 */
export function planDeSuperposition(position: PositionTourelle): number {
  return position.z * 10000 + position.y * 100 + position.x;
}

/** La boite du plateau entier, cotes compris : sans `EPAISSEUR`, le relief du bord droit
 * et du bord bas serait rogne. */
export function boiteDuPlateau(positions: PositionTourelle[]): Rectangle {
  if (positions.length === 0) return { x: 0, y: 0, largeur: 0, hauteur: 0 };

  let gauche = Infinity;
  let haut = Infinity;
  let droite = -Infinity;
  let bas = -Infinity;
  for (const position of positions) {
    const r = rectangleFace(position);
    gauche = Math.min(gauche, r.x);
    haut = Math.min(haut, r.y);
    droite = Math.max(droite, r.x + r.largeur + EPAISSEUR);
    bas = Math.max(bas, r.y + r.hauteur + EPAISSEUR);
  }
  return { x: gauche, y: haut, largeur: droite - gauche, hauteur: bas - haut };
}

/**
 * De combien assombrir une tuile selon sa profondeur sous le sommet du plateau.
 *
 * L'encre bouge DEUX FOIS plus vite que la face. Assombrir la face seule mangerait le
 * contraste entre le symbole et son fond ; deplacer l'encre plus vite l'ELARGIT a mesure
 * que les etages s'eloignent. Un etage recule est donc plus contraste que celui du
 * dessus, jamais moins.
 */
export const PAS_FACE = 0.015;
export const PAS_ENCRE = 0.03;

export function eclairementFace(z: number, zSommet: number): number {
  return 1 - PAS_FACE * Math.max(0, zSommet - z);
}

export function eclairementEncre(z: number, zSommet: number): number {
  return 1 - PAS_ENCRE * Math.max(0, zSommet - z);
}

/**
 * Ce qui distingue une tuile BLOQUEE d'une tuile jouable.
 *
 * Une premiere version n'en distinguait aucune, au motif qu'un vrai Mahjong Solitaire ne
 * grise jamais ses tuiles et que le relief suffit a dire ce qui est jouable. C'est faux,
 * et mesurable : le relief dit la HAUTEUR, pas la liberte. Une tuile peut etre au sommet
 * de sa pile, bien eclairee, bien detachee, et rester injouable parce qu'elle a une
 * voisine de chaque cote. Sur la disposition Tortue, 23 tuiles sur 144 sont libres au
 * depart : 121 clics ne repondent pas, sans que rien n'explique pourquoi.
 *
 * L'assombrissement porte sur la tuile ENTIERE, face et encre ensemble, et non sur la
 * face seule : les deux luminances bougent du meme facteur, donc leur rapport ne change
 * pas et le symbole reste aussi lisible qu'avant. C'est ce qui permet d'aller jusqu'a
 * 0,75, franchement visible, sans rendre les tuiles bloquees difficiles a lire - elles
 * restent la moitie du plateau et on doit pouvoir y chercher sa paire.
 */
export const ECLAIRAGE_BLOQUEE = 0.75;
