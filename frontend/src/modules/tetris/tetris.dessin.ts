import {
  COLONNES,
  COULEURS,
  LIGNES,
  cellules,
  type Piece,
  type Plateau,
  type Sorte,
} from './tetris.logic';

const FOND = '#14161F';
const QUADRILLAGE = '#22252F';

/**
 * Un bloc du Tetris d'origine : un carre plein, un bord clair en haut a gauche, un bord
 * sombre en bas a droite. C'est ce relief qui fait qu'on distingue deux blocs colles de
 * la meme couleur, ce qu'un aplat ne permet pas.
 */
function bloc(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cote: number,
  couleur: string,
) {
  const marge = Math.max(1, Math.round(cote * 0.06));
  ctx.fillStyle = couleur;
  ctx.fillRect(x, y, cote, cote);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.38)';
  ctx.fillRect(x, y, cote, marge);
  ctx.fillRect(x, y, marge, cote);

  ctx.fillStyle = 'rgba(0, 0, 0, 0.30)';
  ctx.fillRect(x, y + cote - marge, cote, marge);
  ctx.fillRect(x + cote - marge, y, marge, cote);
}

export function dessinerPlateau(
  ctx: CanvasRenderingContext2D,
  plateau: Plateau,
  piece: Piece | null,
  ombre: Piece | null,
  cote: number,
  clignote: number[],
) {
  ctx.fillStyle = FOND;
  ctx.fillRect(0, 0, COLONNES * cote, LIGNES * cote);

  // Un quadrillage discret : sans lui, on ne voit pas ou la piece va tomber, et l'on
  // compte les colonnes a l'oeil.
  ctx.strokeStyle = QUADRILLAGE;
  ctx.lineWidth = 1;
  for (let x = 1; x < COLONNES; x++) {
    ctx.beginPath();
    ctx.moveTo(x * cote + 0.5, 0);
    ctx.lineTo(x * cote + 0.5, LIGNES * cote);
    ctx.stroke();
  }
  for (let y = 1; y < LIGNES; y++) {
    ctx.beginPath();
    ctx.moveTo(0, y * cote + 0.5);
    ctx.lineTo(COLONNES * cote, y * cote + 0.5);
    ctx.stroke();
  }

  for (let y = 0; y < LIGNES; y++) {
    for (let x = 0; x < COLONNES; x++) {
      const sorte = plateau[y][x];
      if (!sorte) continue;
      // Une ligne qui vient d'etre completee passe en blanc le temps d'un battement :
      // sans cela, elle disparait sans que rien n'ait signale qu'elle etait pleine.
      bloc(
        ctx,
        x * cote,
        y * cote,
        cote,
        clignote.includes(y) ? '#FFFFFF' : COULEURS[sorte],
      );
    }
  }

  // L'ombre AVANT la piece : si elles se chevauchent, c'est la piece qu'on doit voir.
  if (ombre) {
    ctx.strokeStyle = COULEURS[ombre.sorte];
    ctx.globalAlpha = 0.45;
    ctx.lineWidth = Math.max(2, Math.round(cote * 0.09));
    for (const { x, y } of cellules(ombre)) {
      if (y < 0) continue;
      ctx.strokeRect(
        x * cote + ctx.lineWidth / 2,
        y * cote + ctx.lineWidth / 2,
        cote - ctx.lineWidth,
        cote - ctx.lineWidth,
      );
    }
    ctx.globalAlpha = 1;
  }

  if (piece) {
    for (const { x, y } of cellules(piece)) {
      if (y < 0) continue;
      bloc(ctx, x * cote, y * cote, cote, COULEURS[piece.sorte]);
    }
  }
}

/** La piece suivante, dessinee seule et centree dans sa vignette. */
export function dessinerApercu(
  ctx: CanvasRenderingContext2D,
  sorte: Sorte | null,
  largeur: number,
  hauteur: number,
) {
  ctx.clearRect(0, 0, largeur, hauteur);
  if (!sorte) return;

  const cases = cellules({ sorte, rotation: 0, x: 0, y: 0 });
  const xs = cases.map((c) => c.x);
  const ys = cases.map((c) => c.y);
  const large = Math.max(...xs) - Math.min(...xs) + 1;
  const haut = Math.max(...ys) - Math.min(...ys) + 1;
  const cote = Math.floor(
    Math.min(largeur / (large + 0.5), hauteur / (haut + 0.5)),
  );
  const gauche = (largeur - large * cote) / 2 - Math.min(...xs) * cote;
  const sommet = (hauteur - haut * cote) / 2 - Math.min(...ys) * cote;

  for (const { x, y } of cases) {
    bloc(ctx, gauche + x * cote, sommet + y * cote, cote, COULEURS[sorte]);
  }
}
