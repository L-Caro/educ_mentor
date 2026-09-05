import { describe, expect, it } from 'vitest';
import {
  adversaire,
  chute,
  coupsPossibles,
  creer,
  fenetres,
  gagnant,
  indexDe,
  jouer,
  meilleurCoup,
  pleine,
  type Case,
  type Joueur,
  type Plateau,
} from 'src/utils/plateau';

/**
 * La logique partagée du morpion et du Puissance 4.
 *
 * Ce qui doit être tenu n'est pas visible en jouant deux parties : un adversaire qui rate
 * une victoire en un coup, ou qui laisse gagner alors qu'il pouvait bloquer, passe pour
 * « un peu bête » sans qu'on sache que c'est un bug. Et une détection d'alignement qui
 * oublie une diagonale ne se voit que le jour où l'enfant gagne sans que le jeu le dise.
 */

/** Construit un plateau depuis un dessin, ce qui rend les cas lisibles.
 * `.` vide · `x` joueur 1 · `o` joueur 2 */
function depuis(
  dessin: string[],
  alignement: number,
  gravite: boolean,
): Plateau {
  const lignes = dessin.map((l) => l.replace(/\s/g, ''));
  const colonnes = lignes[0].length;
  const p = creer(colonnes, lignes.length, alignement, gravite);
  const cases: Case[] = [];
  for (const ligne of lignes) {
    for (const c of ligne) {
      cases.push(c === 'x' ? 1 : c === 'o' ? 2 : 0);
    }
  }
  return { ...p, cases };
}

const morpion = (dessin: string[]) => depuis(dessin, 3, false);
const p4 = (dessin: string[]) => depuis(dessin, 4, true);

/** Tirage déterministe : toujours le premier candidat. */
const premier = () => 0;

describe('géométrie', () => {
  it('indexe les cases ligne par ligne depuis le haut', () => {
    const p = creer(3, 3, 3, false);
    expect(indexDe(p, 0, 0)).toBe(0);
    expect(indexDe(p, 2, 0)).toBe(2);
    expect(indexDe(p, 0, 1)).toBe(3);
    expect(indexDe(p, 2, 2)).toBe(8);
  });

  it('énumère toutes les fenêtres du morpion : 3 lignes, 3 colonnes, 2 diagonales', () => {
    expect(fenetres(creer(3, 3, 3, false))).toHaveLength(8);
  });

  it('énumère les fenêtres du Puissance 4', () => {
    // 7×6, alignement 4 : 24 horizontales + 21 verticales + 12 + 12 diagonales = 69.
    expect(fenetres(creer(7, 6, 4, true))).toHaveLength(69);
  });

  it('ne compte pas les fenêtres qui sortent du plateau', () => {
    // Une grille 3×3 avec alignement 4 n'a aucune fenêtre : rien ne doit être inventé.
    expect(fenetres(creer(3, 3, 4, false))).toHaveLength(0);
  });
});

describe('détection d’alignement', () => {
  it('voit une ligne', () => {
    expect(gagnant(morpion(['xxx', '.o.', 'o..']))?.joueur).toBe(1);
  });

  it('voit une colonne', () => {
    expect(gagnant(morpion(['o..', 'o.x', 'o.x']))?.joueur).toBe(2);
  });

  it('voit les deux diagonales', () => {
    expect(gagnant(morpion(['x..', '.x.', '..x']))?.joueur).toBe(1);
    expect(gagnant(morpion(['..o', '.o.', 'o..']))?.joueur).toBe(2);
  });

  it('rend les cellules alignées, pour les mettre en évidence', () => {
    const v = gagnant(morpion(['xxx', '...', '...']))!;
    expect(v.cellules).toEqual([0, 1, 2]);
  });

  it('ne voit rien quand il n’y a rien', () => {
    expect(gagnant(morpion(['xox', 'oxo', 'oxo']))).toBeNull();
  });

  it('voit une diagonale de Puissance 4, cas le plus souvent oublié', () => {
    const v = gagnant(
      p4([
        '.......',
        '.......',
        '...x...',
        '..xo...',
        '.xoo...',
        'xooo...',
      ]),
    );
    expect(v?.joueur).toBe(1);
  });

  it('déclare le plateau plein', () => {
    expect(pleine(morpion(['xox', 'oxo', 'oxo']))).toBe(true);
    expect(pleine(morpion(['xox', 'oxo', 'ox.']))).toBe(false);
  });
});

describe('gravité du Puissance 4', () => {
  it('n’offre qu’une case par colonne : la plus basse libre', () => {
    const p = p4([
      '.......',
      '.......',
      '.......',
      '.......',
      '.......',
      'x......',
    ]);
    const coups = coupsPossibles(p);
    expect(coups).toHaveLength(7);
    // La colonne 0 porte déjà un pion en bas : le prochain tombe juste au-dessus.
    expect(coups).toContain(indexDe(p, 0, 4));
    expect(coups).not.toContain(indexDe(p, 0, 3));
  });

  it('ignore une colonne pleine', () => {
    const p = p4(['x......', 'o......', 'x......', 'o......', 'x......', 'o......']);
    expect(chute(p, 0)).toBeNull();
    expect(coupsPossibles(p)).toHaveLength(6);
  });

  it('laisse le morpion poser n’importe où', () => {
    const p = morpion(['x.o', '...', '...']);
    expect(coupsPossibles(p)).toHaveLength(7);
  });
});

describe('l’adversaire', () => {
  it('ne modifie jamais le plateau qu’il explore', () => {
    const p = morpion(['x..', '...', '...']);
    const avant = [...p.cases];
    meilleurCoup(p, 2, 4, premier);
    expect(p.cases).toEqual(avant);
  });

  it('prend une victoire en un coup', () => {
    // o a deux pions alignés et la troisième case libre : il doit la prendre.
    const p = morpion(['oo.', 'xx.', '...']);
    expect(meilleurCoup(p, 2, 4, premier)).toBe(indexDe(p, 2, 0));
  });

  it('préfère gagner plutôt que bloquer', () => {
    // o peut gagner tout de suite ET x menace : gagner passe d'abord.
    const p = morpion(['oo.', 'xx.', '...']);
    expect(meilleurCoup(p, 2, 4, premier)).toBe(indexDe(p, 2, 0));
  });

  it('bloque une victoire adverse quand il ne peut pas gagner', () => {
    const p = morpion(['xx.', 'o..', '...']);
    expect(meilleurCoup(p, 2, 4, premier)).toBe(indexDe(p, 2, 0));
  });

  it('conclut au plus vite au lieu de traîner', () => {
    // Sans le terme de profondeur, une victoire en trois coups vaut autant qu'en un, et
    // l'adversaire donne l'impression de jouer mal.
    const p = morpion(['oo.', '.x.', 'x..']);
    expect(meilleurCoup(p, 2, 6, premier)).toBe(indexDe(p, 2, 0));
  });

  it('joue au hasard en facile, donc reste battable', () => {
    const p = morpion(['oo.', 'xx.', '...']);
    // Profondeur 0 : il ne cherche rien. Il DOIT pouvoir manquer la victoire évidente,
    // sinon « facile » n'est pas facile.
    const coups = new Set(
      Array.from({ length: 40 }, () => meilleurCoup(p, 2, 0)),
    );
    expect(coups.size).toBeGreaterThan(1);
  });

  it('ne perd jamais au morpion en profondeur maximale', () => {
    // Le morpion parfaitement joué est un match nul. On fait jouer x au hasard contre un
    // o parfait : o ne doit jamais perdre, sur cent parties.
    for (let partie = 0; partie < 100; partie++) {
      let p = creer(3, 3, 3, false);
      let tour: Joueur = 1;
      while (!gagnant(p) && !pleine(p)) {
        const coup =
          tour === 1
            ? meilleurCoup(p, 1, 0)
            : meilleurCoup(p, 2, 9);
        if (coup === null) break;
        p = jouer(p, coup, tour);
        tour = adversaire(tour);
      }
      expect(gagnant(p)?.joueur ?? 0).not.toBe(1);
    }
  });

  it('bloque un alignement de trois au Puissance 4', () => {
    const p = p4([
      '.......',
      '.......',
      '.......',
      '.......',
      '.......',
      'xxx....',
    ]);
    // La seule case qui empêche x de gagner est la quatrième de la ligne du bas.
    expect(meilleurCoup(p, 2, 4, premier)).toBe(indexDe(p, 3, 5));
  });

  it('prend une victoire en un coup au Puissance 4', () => {
    const p = p4([
      '.......',
      '.......',
      '.......',
      '.......',
      '.......',
      'ooo.xx.',
    ]);
    expect(meilleurCoup(p, 2, 4, premier)).toBe(indexDe(p, 3, 5));
  });

  it('rend null quand il n’y a plus de coup', () => {
    expect(meilleurCoup(morpion(['xox', 'oxo', 'oxo']), 1, 4, premier)).toBeNull();
  });
});
