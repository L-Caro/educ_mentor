/**
 * Tétris : le plateau, les pièces, et les règles. Rien d'affichage ici.
 *
 * Tout est PUR et testable : le composant ne fait qu'appeler ces fonctions et dessiner ce
 * qu'elles rendent. C'est ce qui permet de verifier les regles delicates - la rotation
 * contre un mur, l'effacement de plusieurs lignes d'un coup - sans ouvrir un navigateur.
 */

export const COLONNES = 10;
export const LIGNES = 20;

export type Sorte = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

export const SORTES: readonly Sorte[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

/**
 * Les sept pièces, dans leur orientation de depart.
 *
 * Une seule matrice par piece, CARREE : les trois autres orientations se calculent en la
 * tournant. Ecrire les quatre a la main, c'est vingt-huit matrices a maintenir et autant
 * d'occasions de se tromper d'une case, pour un resultat qu'une rotation donne
 * gratuitement.
 *
 * La taille de la boite n'est pas decorative. Le `I` tourne dans une boite de quatre et
 * l'`O` dans une boite de deux : c'est ce qui fait qu'un `I` horizontal redevient vertical
 * au bon endroit, et qu'un `O` ne bouge pas du tout quand on le tourne.
 */
export const FORMES: Record<Sorte, number[][]> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ],
  O: [
    [1, 1],
    [1, 1],
  ],
  T: [
    [0, 1, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  S: [
    [0, 1, 1],
    [1, 1, 0],
    [0, 0, 0],
  ],
  Z: [
    [1, 1, 0],
    [0, 1, 1],
    [0, 0, 0],
  ],
  J: [
    [1, 0, 0],
    [1, 1, 1],
    [0, 0, 0],
  ],
  L: [
    [0, 0, 1],
    [1, 1, 1],
    [0, 0, 0],
  ],
};

/** Les couleurs d'origine : chaque piece a la sienne depuis 1989, et c'est a cela qu'on
 * reconnait un Tetris. */
export const COULEURS: Record<Sorte, string> = {
  I: '#31C7EF',
  O: '#F7D308',
  T: '#AD4D9C',
  S: '#42B642',
  Z: '#EF2029',
  J: '#5A65AD',
  L: '#EF7921',
};

export interface Piece {
  sorte: Sorte;
  /** 0 a 3, dans le sens des aiguilles d'une montre. */
  rotation: number;
  /** Le coin haut-gauche de la boite de la piece, en cases du plateau. */
  x: number;
  y: number;
}

/** Une case vide vaut `null` ; sinon elle garde la sorte qui l'a remplie, donc sa
 * couleur. */
export type Plateau = (Sorte | null)[][];

export function plateauVide(): Plateau {
  return Array.from({ length: LIGNES }, () =>
    Array.from({ length: COLONNES }, () => null),
  );
}

/** La matrice de la piece dans son orientation courante. */
export function matrice(piece: Piece): number[][] {
  let forme = FORMES[piece.sorte];
  for (let tour = 0; tour < piece.rotation % 4; tour++) {
    forme = tournerMatrice(forme);
  }
  return forme;
}

/** Un quart de tour dans le sens des aiguilles d'une montre. */
function tournerMatrice(forme: number[][]): number[][] {
  const n = forme.length;
  return Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => forme[n - 1 - j][i]),
  );
}

/** Les cases occupees par la piece, en coordonnees du plateau. */
export function cellules(piece: Piece): { x: number; y: number }[] {
  const forme = matrice(piece);
  const cases: { x: number; y: number }[] = [];
  for (let i = 0; i < forme.length; i++) {
    for (let j = 0; j < forme.length; j++) {
      if (forme[i][j]) cases.push({ x: piece.x + j, y: piece.y + i });
    }
  }
  return cases;
}

/**
 * La piece heurte-t-elle un mur, le fond, ou un bloc deja pose ?
 *
 * Au-DESSUS du plateau ne heurte rien : une piece qui vient d'apparaitre a encore une
 * partie de sa boite hors de l'ecran, et la refuser rendrait l'apparition impossible.
 */
export function heurte(plateau: Plateau, piece: Piece): boolean {
  return cellules(piece).some(
    ({ x, y }) =>
      x < 0 ||
      x >= COLONNES ||
      y >= LIGNES ||
      (y >= 0 && plateau[y][x] !== null),
  );
}

export function deplacer(
  plateau: Plateau,
  piece: Piece,
  dx: number,
  dy: number,
): Piece | null {
  const bouge = { ...piece, x: piece.x + dx, y: piece.y + dy };
  return heurte(plateau, bouge) ? null : bouge;
}

/**
 * Les decalages essayes quand la rotation ne passe pas telle quelle.
 *
 * Sans eux, une piece collee au mur refuse de tourner, et cela passe pour une panne : on
 * appuie, rien ne se produit, et rien ne dit pourquoi. On essaie donc de la pousser d'une
 * case, puis de deux - le `I` en a besoin, il est long - puis de la soulever d'une case,
 * pour les rotations qui buttent sur le tas plutot que sur un mur.
 *
 * Ce n'est pas le systeme du Tetris de competition, qui donne une table de decalages
 * differente par piece et par sens de rotation. Celui-la se verifie du regard et se teste
 * entierement ; l'autre se recopie, et une ligne recopiee de travers ne se voit pas.
 */
const DECALAGES: [number, number][] = [
  [0, 0],
  [-1, 0],
  [1, 0],
  [-2, 0],
  [2, 0],
  [0, -1],
];

export function tourner(
  plateau: Plateau,
  piece: Piece,
  sens: 1 | -1,
): Piece | null {
  const rotation = (piece.rotation + sens + 4) % 4;
  for (const [dx, dy] of DECALAGES) {
    const essai = { ...piece, rotation, x: piece.x + dx, y: piece.y + dy };
    if (!heurte(plateau, essai)) return essai;
  }
  return null;
}

/** La piece posee le plus bas possible : la ou un lacher immediat la mettrait, et ou
 * l'ombre se dessine. */
export function chute(plateau: Plateau, piece: Piece): Piece {
  let bas = piece;
  for (;;) {
    const suivant = deplacer(plateau, bas, 0, 1);
    if (!suivant) return bas;
    bas = suivant;
  }
}

/** Fige la piece dans le plateau. Rend un NOUVEAU plateau : l'ancien sert encore a
 * dessiner l'image precedente. */
export function poser(plateau: Plateau, piece: Piece): Plateau {
  const suite = plateau.map((ligne) => [...ligne]);
  for (const { x, y } of cellules(piece)) {
    if (y >= 0 && y < LIGNES && x >= 0 && x < COLONNES)
      suite[y][x] = piece.sorte;
  }
  return suite;
}

/** Retire les lignes pleines et fait descendre le reste. */
export function effacer(plateau: Plateau): {
  plateau: Plateau;
  lignes: number[];
} {
  const lignes: number[] = [];
  plateau.forEach((ligne, y) => {
    if (ligne.every((case_) => case_ !== null)) lignes.push(y);
  });
  if (lignes.length === 0) return { plateau, lignes };

  const restantes = plateau.filter((_, y) => !lignes.includes(y));
  const neuves = Array.from({ length: lignes.length }, () =>
    Array.from({ length: COLONNES }, () => null as Sorte | null),
  );
  return { plateau: [...neuves, ...restantes], lignes };
}

export type Rand = (min: number, max: number) => number;

/**
 * Un sac des sept pièces, mélangé.
 *
 * Les pieces ne sont pas tirees au hasard une par une : chacune sort une fois par sac.
 * Un vrai hasard peut faire attendre la barre pendant vingt pieces, ce qui n'est pas
 * difficile mais injuste, et impossible a comprendre quand on a sept ans.
 */
export function nouveauSac(rand: Rand): Sorte[] {
  const sac = [...SORTES];
  for (let i = sac.length - 1; i > 0; i--) {
    const j = rand(0, i);
    [sac[i], sac[j]] = [sac[j], sac[i]];
  }
  return sac;
}

/**
 * La piece qui apparait : centree en haut, dans son orientation de depart.
 *
 * La boite est remontee de ses lignes vides, pas d'un nombre fixe. Le `I` a une ligne
 * vide au-dessus de lui, le carre n'en a pas : les remonter tous d'une case ferait
 * apparaitre le carre a moitie hors de l'ecran, et sa moitie haute serait perdue au
 * moment ou il se pose.
 */
export function apparaitre(sorte: Sorte): Piece {
  const forme = FORMES[sorte];
  const videsEnHaut = forme.findIndex((ligne) => ligne.some(Boolean));
  return {
    sorte,
    rotation: 0,
    x: Math.floor((COLONNES - forme.length) / 2),
    y: -videsEnHaut,
  };
}

/**
 * Le temps de chute d'une ligne, en millisecondes, par niveau.
 *
 * Ce sont les valeurs du Tetris d'origine, comptees en images par seconde : 48 images au
 * niveau zero, une seule a partir du vingt-neuvieme. On ne les invente pas, c'est ce
 * rythme-la que le jeu a toujours eu.
 */
const IMAGES_PAR_LIGNE = [
  48, 43, 38, 33, 28, 23, 18, 13, 8, 6, 5, 5, 5, 4, 4, 4, 3, 3, 3, 2, 2, 2, 2,
  2, 2, 2, 2, 2, 2, 1,
];

export function vitesse(niveau: number): number {
  const images =
    IMAGES_PAR_LIGNE[Math.min(niveau, IMAGES_PAR_LIGNE.length - 1)];
  return (images * 1000) / 60;
}

/** Le niveau monte toutes les dix lignes, a partir de celui qu'on a choisi au depart. */
export function niveauPour(depart: number, lignes: number): number {
  return depart + Math.floor(lignes / 10);
}

/**
 * Les points d'un effacement : une ligne seule rapporte peu, quatre d'un coup rapportent
 * douze fois plus. C'est ce qui fait qu'on CREUSE au lieu d'effacer des qu'on peut, et
 * c'est tout l'interet du jeu.
 */
const POINTS = [0, 40, 100, 300, 1200];

export function points(lignes: number, niveau: number): number {
  return POINTS[Math.min(lignes, 4)] * (niveau + 1);
}

/**
 * Ce qui se passe quand une piece se fige : elle entre dans le plateau, les lignes
 * pleines s'en vont, le score et le niveau suivent.
 *
 * Deux plateaux sont rendus, et c'est voulu. Le premier garde les lignes pleines : c'est
 * celui qui clignote en blanc, le temps d'un battement, pour que l'on voie CE QUI a ete
 * complete. Le second est celui d'apres. Les calculer ici plutot que dans la boucle
 * d'affichage, c'est pouvoir verifier qu'un quadruple compte bien quatre lignes et
 * douze fois les points d'une seule, ce qu'aucune partie jouee a la main ne produit sur
 * commande.
 */
export interface Figee {
  clignotant: Plateau;
  suivant: Plateau;
  effacees: number[];
  score: number;
  lignes: number;
  niveau: number;
}

export function figerPiece(
  plateau: Plateau,
  piece: Piece,
  score: number,
  lignes: number,
  niveauDepart: number,
): Figee {
  const clignotant = poser(plateau, piece);
  const { plateau: suivant, lignes: effacees } = effacer(clignotant);
  const niveauAvant = niveauPour(niveauDepart, lignes);
  const total = lignes + effacees.length;
  return {
    clignotant,
    suivant,
    effacees,
    // Les points se comptent au niveau ou l'on JOUAIT, pas a celui que l'effacement fait
    // atteindre : sinon la ligne qui fait monter de niveau se paierait au tarif du
    // niveau suivant, qu'on n'a pas encore joue.
    score: score + points(effacees.length, niveauAvant),
    lignes: total,
    niveau: niveauPour(niveauDepart, total),
  };
}
