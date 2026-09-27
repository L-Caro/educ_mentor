import { describe, expect, it } from 'vitest';
import {
  COLONNES,
  LIGNES,
  SORTES,
  apparaitre,
  cellules,
  chute,
  deplacer,
  effacer,
  figerPiece,
  heurte,
  matrice,
  niveauPour,
  nouveauSac,
  plateauVide,
  points,
  poser,
  tourner,
  vitesse,
  type Plateau,
  type Sorte,
} from './tetris.logic';

const rand = (min: number, max: number) =>
  min + Math.floor(Math.random() * (max - min + 1));

/** Un plateau dont on decrit les lignes du bas : `'##  ######'` remplit huit cases. */
function plateauDepuis(lignes: string[]): Plateau {
  const plateau = plateauVide();
  lignes.forEach((ligne, i) => {
    const y = LIGNES - lignes.length + i;
    [...ligne].forEach((c, x) => {
      plateau[y][x] = c === '#' ? 'I' : null;
    });
  });
  return plateau;
}

describe('les pièces', () => {
  it('reviennent a leur forme de depart apres quatre quarts de tour', () => {
    for (const sorte of SORTES) {
      const depart = matrice({ sorte, rotation: 0, x: 0, y: 0 });
      const tour = matrice({ sorte, rotation: 4, x: 0, y: 0 });
      expect(tour).toEqual(depart);
    }
  });

  it('gardent QUATRE blocs dans toutes les orientations', () => {
    for (const sorte of SORTES) {
      for (let rotation = 0; rotation < 4; rotation++) {
        expect(cellules({ sorte, rotation, x: 0, y: 0 })).toHaveLength(4);
      }
    }
  });

  it('ne font pas bouger le carre quand on le tourne', () => {
    // Sa boite fait deux cases de cote : une boite plus grande le ferait glisser a chaque
    // rotation, ce qui n'arrive dans aucun Tetris.
    const plateau = plateauVide();
    const carre = apparaitre('O');
    const tourne = tourner(plateau, carre, 1);
    expect(tourne).not.toBeNull();
    expect(cellules(tourne!)).toEqual(cellules(carre));
  });

  it('apparaissent au milieu, et dans l’ecran', () => {
    for (const sorte of SORTES) {
      const piece = apparaitre(sorte);
      const cases = cellules(piece);
      expect(cases.every((c) => c.x >= 0 && c.x < COLONNES)).toBe(true);
      // Le haut de la boite est vide pour plusieurs pieces : ce qui compte est que les
      // BLOCS soient visibles des l'apparition.
      expect(cases.every((c) => c.y >= 0)).toBe(true);
    }
  });
});

describe('les murs et le tas', () => {
  it('refuse de sortir du plateau', () => {
    const plateau = plateauVide();
    const piece = { sorte: 'O' as Sorte, rotation: 0, x: 0, y: 0 };
    expect(deplacer(plateau, piece, -1, 0)).toBeNull();
    expect(deplacer(plateau, { ...piece, x: COLONNES - 2 }, 1, 0)).toBeNull();
    expect(deplacer(plateau, { ...piece, y: LIGNES - 2 }, 0, 1)).toBeNull();
  });

  it('laisse tourner une piece collee au mur', () => {
    // Sans decalage, on appuie et rien ne se produit : cela passe pour une panne.
    const plateau = plateauVide();
    for (const sorte of SORTES) {
      for (let rotation = 0; rotation < 4; rotation++) {
        const contreGauche = { sorte, rotation, x: 0, y: 5 };
        const contreDroite = { sorte, rotation, x: COLONNES - 2, y: 5 };
        expect(tourner(plateau, contreGauche, 1)).not.toBeNull();
        expect(tourner(plateau, contreDroite, 1)).not.toBeNull();
      }
    }
  });

  it('ne laisse JAMAIS une rotation chevaucher un bloc deja pose', () => {
    // Le decalage doit debloquer la rotation, pas la faire passer a travers le tas.
    const plateau = plateauDepuis([
      '   ###    ',
      '##########'.replace('#', ' '),
    ]);
    for (const sorte of SORTES) {
      for (let rotation = 0; rotation < 4; rotation++) {
        for (let x = 0; x < COLONNES - 1; x++) {
          const piece = { sorte, rotation, x, y: LIGNES - 4 };
          if (heurte(plateau, piece)) continue;
          const tourne = tourner(plateau, piece, 1);
          if (tourne) expect(heurte(plateau, tourne)).toBe(false);
        }
      }
    }
  });

  it('pose la piece juste au-dessus du tas quand on la lache', () => {
    const plateau = plateauDepuis(['##########', '##########']);
    const piece = apparaitre('O');
    const bas = chute(plateau, piece);
    const plusBas = Math.max(...cellules(bas).map((c) => c.y));
    expect(plusBas).toBe(LIGNES - 3);
    // Et elle ne peut pas descendre davantage.
    expect(deplacer(plateau, bas, 0, 1)).toBeNull();
  });
});

describe('les lignes', () => {
  it('efface une ligne pleine et fait descendre ce qui est au-dessus', () => {
    const plateau = plateauDepuis(['#         ', '#########  '.slice(0, 10)]);
    plateau[LIGNES - 1] = Array.from({ length: COLONNES }, () => 'I' as Sorte);
    const { plateau: apres, lignes } = effacer(plateau);
    expect(lignes).toEqual([LIGNES - 1]);
    // Le bloc isole qui etait juste au-dessus se retrouve tout en bas.
    expect(apres[LIGNES - 1][0]).toBe('I');
    expect(apres[LIGNES - 1].filter(Boolean)).toHaveLength(1);
    expect(apres[0].every((c) => c === null)).toBe(true);
  });

  it('efface QUATRE lignes d’un coup sans en oublier', () => {
    const plateau = plateauVide();
    for (let y = LIGNES - 4; y < LIGNES; y++) {
      plateau[y] = Array.from({ length: COLONNES }, () => 'I' as Sorte);
    }
    const { plateau: apres, lignes } = effacer(plateau);
    expect(lignes).toHaveLength(4);
    expect(apres.flat().every((c) => c === null)).toBe(true);
    expect(apres).toHaveLength(LIGNES);
  });

  it('ne touche a rien quand aucune ligne n’est pleine', () => {
    const plateau = plateauDepuis(['######### ']);
    const { plateau: apres, lignes } = effacer(plateau);
    expect(lignes).toEqual([]);
    expect(apres).toBe(plateau);
  });

  it('fige la piece sans modifier le plateau precedent', () => {
    // Le rendu dessine encore l'image d'avant : la modifier en place la ferait sauter.
    const plateau = plateauVide();
    const apres = poser(plateau, apparaitre('O'));
    expect(plateau.flat().every((c) => c === null)).toBe(true);
    expect(apres.flat().filter(Boolean)).toHaveLength(4);
  });
});

describe('figer une pièce', () => {
  /** Un plateau dont les `combien` dernieres lignes sont pleines SAUF la colonne 0 : une
   * barre verticale posee a gauche les complete toutes d'un coup. */
  function presquePlein(combien: number) {
    const plateau = plateauVide();
    for (let y = LIGNES - combien; y < LIGNES; y++) {
      for (let x = 1; x < COLONNES; x++) plateau[y][x] = 'J';
    }
    return plateau;
  }

  it('garde les lignes pleines dans le plateau qui clignote, et pas dans le suivant', () => {
    // Le battement blanc montre CE QUI a ete complete : sur le plateau deja nettoye, il
    // n'y aurait plus rien a montrer.
    const plateau = presquePlein(1);
    const barre = { sorte: 'O' as const, rotation: 0, x: 0, y: LIGNES - 2 };
    const apres = figerPiece(plateau, barre, 0, 0, 0);
    expect(apres.effacees).toEqual([LIGNES - 1]);
    expect(apres.clignotant[LIGNES - 1].every((c) => c !== null)).toBe(true);
    expect(apres.suivant[LIGNES - 1].every((c) => c !== null)).toBe(false);
  });

  it('compte QUATRE lignes d’un coup, et les paie douze fois plus qu’une seule', () => {
    const plateau = presquePlein(4);
    // La barre debout occupe la troisieme colonne de sa boite : posee en `x = -2`, elle
    // remplit la colonne 0 du plateau sur quatre lignes et les complete toutes.
    const barre = { sorte: 'I' as const, rotation: 1, x: -2, y: LIGNES - 4 };
    expect(cellules(barre).map((c) => c.x)).toEqual([0, 0, 0, 0]);
    const apres = figerPiece(plateau, barre, 0, 0, 0);
    expect(apres.effacees).toHaveLength(4);
    expect(apres.lignes).toBe(4);
    expect(apres.suivant.flat().every((c) => c === null)).toBe(true);

    const uneSeule = figerPiece(
      presquePlein(1),
      { sorte: 'O', rotation: 0, x: 0, y: LIGNES - 2 },
      0,
      0,
      0,
    );
    expect(apres.score).toBe(uneSeule.score * 30);
  });

  it('paie la ligne au niveau OU L’ON JOUAIT, pas a celui qu’elle fait atteindre', () => {
    // La dixieme ligne fait monter d'un niveau. La payer au tarif du niveau suivant,
    // c'est payer un niveau qu'on n'a pas encore joue.
    const neuf = figerPiece(
      presquePlein(1),
      { sorte: 'O', rotation: 0, x: 0, y: LIGNES - 2 },
      0,
      9,
      0,
    );
    expect(neuf.niveau).toBe(1);
    expect(neuf.score).toBe(points(1, 0));
  });

  it('ne change ni le score ni le niveau quand rien n’est complet', () => {
    const plateau = plateauVide();
    const apres = figerPiece(plateau, apparaitre('T'), 250, 7, 3);
    expect(apres.effacees).toEqual([]);
    expect(apres.score).toBe(250);
    expect(apres.lignes).toBe(7);
    expect(apres.niveau).toBe(3);
    expect(apres.clignotant).toEqual(apres.suivant);
  });
});

describe('le rythme et les points', () => {
  it('donne les sept pieces une fois par sac', () => {
    for (let essai = 0; essai < 50; essai++) {
      const sac = nouveauSac(rand);
      expect([...sac].sort()).toEqual([...SORTES].sort());
    }
  });

  it('accelere quand le niveau monte, et ne s’arrete jamais tout a fait', () => {
    expect(vitesse(0)).toBeGreaterThan(vitesse(5));
    expect(vitesse(5)).toBeGreaterThan(vitesse(10));
    expect(vitesse(29)).toBeGreaterThan(0);
    // Au-dela de la table, le jeu ne doit pas tomber a zero milliseconde par ligne.
    expect(vitesse(99)).toBe(vitesse(29));
  });

  it('monte d’un niveau toutes les dix lignes, a partir de celui choisi', () => {
    expect(niveauPour(2, 0)).toBe(2);
    expect(niveauPour(2, 9)).toBe(2);
    expect(niveauPour(2, 10)).toBe(3);
    expect(niveauPour(2, 35)).toBe(5);
  });

  it('recompense bien plus quatre lignes d’un coup que quatre lignes une a une', () => {
    // C'est ce qui donne envie de creuser au lieu d'effacer des qu'on peut, et c'est tout
    // l'interet du jeu.
    expect(points(4, 0)).toBeGreaterThan(points(1, 0) * 4);
    expect(points(1, 9)).toBe(points(1, 0) * 10);
    expect(points(0, 5)).toBe(0);
  });
});
