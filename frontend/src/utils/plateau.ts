/**
 * Le cœur commun du morpion et du Puissance 4.
 *
 * Les deux sont le MÊME jeu : aligner N pions sur une grille, à tour de rôle. Seuls
 * changent les dimensions, la longueur de l'alignement, et la façon dont un coup se pose
 * - n'importe où pour le morpion, dans la colonne qui tombe pour le Puissance 4.
 *
 * Ce fichier est partagé et non dupliqué, alors que la règle du projet est de ne
 * factoriser qu'à partir de trois usages. L'exception est assumée : ce n'est pas une
 * abstraction spéculative, c'est le même algorithme avec d'autres paramètres. Écrire deux
 * fois une détection d'alignement et deux fois un minimax donnerait deux occasions de se
 * tromper sur exactement la même chose.
 *
 * Les vues, elles, ne sont PAS partagées : des croix et des ronds ne ressemblent en rien à
 * des jetons qui tombent, et forcer un composant commun coûterait plus qu'il ne rend.
 *
 * Ce fichier vit dans `utils/` et non dans `modules/` : là-bas, un dossier EST un module,
 * avec son descripteur et son entrée au catalogue : c'est une convention sur laquelle
 * `modules-registry.test.ts` s'appuie. Y déposer une bibliothèque cassait le test.
 */

export type Joueur = 1 | 2;
export type Case = 0 | Joueur;

export interface Plateau {
  /** Les cases, à plat, ligne par ligne depuis le HAUT. */
  cases: Case[];
  colonnes: number;
  lignes: number;
  /** Combien de pions alignés font gagner. */
  alignement: number;
  /** Les pions tombent-ils au plus bas de leur colonne ? (Puissance 4) */
  gravite: boolean;
}

export function creer(
  colonnes: number,
  lignes: number,
  alignement: number,
  gravite: boolean,
): Plateau {
  return {
    cases: Array.from({ length: colonnes * lignes }, () => 0 as Case),
    colonnes,
    lignes,
    alignement,
    gravite,
  };
}

export const indexDe = (p: Plateau, colonne: number, ligne: number): number =>
  ligne * p.colonnes + colonne;

export const colonneDe = (p: Plateau, cellule: number): number =>
  cellule % p.colonnes;

export const ligneDe = (p: Plateau, cellule: number): number =>
  Math.floor(cellule / p.colonnes);

// ─── Coups légaux ───────────────────────────────────────────────────────────

/** Les cases où un pion peut être posé.
 *
 * Avec gravité, une colonne n'offre qu'UNE case : la plus basse encore libre. Rendre
 * toutes les cases libres de la colonne laisserait poser un jeton en l'air. */
export function coupsPossibles(p: Plateau): number[] {
  if (!p.gravite) {
    return p.cases.flatMap((c, i) => (c === 0 ? [i] : []));
  }

  const coups: number[] = [];
  for (let colonne = 0; colonne < p.colonnes; colonne++) {
    for (let ligne = p.lignes - 1; ligne >= 0; ligne--) {
      const cellule = indexDe(p, colonne, ligne);
      if (p.cases[cellule] === 0) {
        coups.push(cellule);
        break;
      }
    }
  }
  return coups;
}

/** La case où tomberait un jeton lâché dans cette colonne, ou `null` si elle est pleine. */
export function chute(p: Plateau, colonne: number): number | null {
  for (let ligne = p.lignes - 1; ligne >= 0; ligne--) {
    const cellule = indexDe(p, colonne, ligne);
    if (p.cases[cellule] === 0) return cellule;
  }
  return null;
}

/** Pose un pion et rend un NOUVEAU plateau : le minimax explore, il ne doit jamais
 * modifier la partie en cours. */
export function jouer(p: Plateau, cellule: number, joueur: Joueur): Plateau {
  const cases = [...p.cases];
  cases[cellule] = joueur;
  return { ...p, cases };
}

export const pleine = (p: Plateau): boolean => p.cases.every((c) => c !== 0);

// ─── Alignements ────────────────────────────────────────────────────────────

/** Les quatre directions à explorer. Les quatre opposées sont inutiles : parcourir
 * chaque fenêtre depuis son extrémité gauche/haute les couvre déjà. */
const DIRECTIONS = [
  [1, 0], // →
  [0, 1], // ↓
  [1, 1], // ↘
  [1, -1], // ↗
] as const;

/** Toutes les fenêtres de `alignement` cases consécutives du plateau, en cellules.
 *
 * Calculées une fois par géométrie et mémorisées : le minimax les reparcourt des milliers
 * de fois, et les recalculer à chaque nœud dominait le temps de calcul. */
const FENETRES = new Map<string, number[][]>();

export function fenetres(p: Plateau): number[][] {
  const cle = `${p.colonnes}x${p.lignes}x${p.alignement}`;
  const memo = FENETRES.get(cle);
  if (memo) return memo;

  const toutes: number[][] = [];
  for (let ligne = 0; ligne < p.lignes; ligne++) {
    for (let colonne = 0; colonne < p.colonnes; colonne++) {
      for (const [dc, dl] of DIRECTIONS) {
        const cellules: number[] = [];
        for (let k = 0; k < p.alignement; k++) {
          const c = colonne + dc * k;
          const l = ligne + dl * k;
          if (c < 0 || c >= p.colonnes || l < 0 || l >= p.lignes) break;
          cellules.push(indexDe(p, c, l));
        }
        if (cellules.length === p.alignement) toutes.push(cellules);
      }
    }
  }

  FENETRES.set(cle, toutes);
  return toutes;
}

export interface Victoire {
  joueur: Joueur;
  /** Les cellules alignées, pour les mettre en évidence. */
  cellules: number[];
}

export function gagnant(p: Plateau): Victoire | null {
  for (const cellules of fenetres(p)) {
    const premier = p.cases[cellules[0]];
    if (premier === 0) continue;
    if (cellules.every((c) => p.cases[c] === premier)) {
      return { joueur: premier, cellules };
    }
  }
  return null;
}

// ─── L'adversaire ───────────────────────────────────────────────────────────

export const adversaire = (joueur: Joueur): Joueur => (joueur === 1 ? 2 : 1);

const GAIN = 100_000;

/** Évaluation d'une position non terminale.
 *
 * On compte les fenêtres encore ouvertes : celles qui ne contiennent que mes pions et du
 * vide valent d'autant plus que j'y ai de pions. Sans cette heuristique, un minimax
 * tronqué en profondeur rendrait 0 partout et jouerait au hasard. */
function evaluer(p: Plateau, joueur: Joueur): number {
  const autre = adversaire(joueur);
  let score = 0;

  for (const cellules of fenetres(p)) {
    let miens = 0;
    let siens = 0;
    for (const c of cellules) {
      if (p.cases[c] === joueur) miens++;
      else if (p.cases[c] === autre) siens++;
    }
    // Une fenêtre partagée est morte : personne ne peut plus la compléter.
    if (miens > 0 && siens > 0) continue;
    if (miens > 0) score += miens * miens;
    if (siens > 0) score -= siens * siens;
  }

  return score;
}

function negamax(
  p: Plateau,
  joueur: Joueur,
  profondeur: number,
  alpha: number,
  beta: number,
): number {
  const victoire = gagnant(p);
  if (victoire) {
    // Une victoire proche vaut mieux qu'une victoire lointaine, et une défaite lointaine
    // mieux qu'une défaite immédiate : sans ce terme, l'adversaire « traîne » au lieu de
    // conclure, ce qui donne l'impression qu'il joue mal.
    return victoire.joueur === joueur
      ? GAIN + profondeur
      : -(GAIN + profondeur);
  }
  if (pleine(p)) return 0;
  if (profondeur === 0) return evaluer(p, joueur);

  let meilleur = -Infinity;
  for (const coup of coupsPossibles(p)) {
    const valeur = -negamax(
      jouer(p, coup, joueur),
      adversaire(joueur),
      profondeur - 1,
      -beta,
      -alpha,
    );
    if (valeur > meilleur) meilleur = valeur;
    if (meilleur > alpha) alpha = meilleur;
    if (alpha >= beta) break; // élagage : cette branche ne sera pas choisie
  }
  return meilleur;
}

/** Le coup que joue l'adversaire.
 *
 * `profondeur` 0 rend un coup au hasard : c'est le niveau facile, et il doit être
 * réellement battable. `rand` est injecté pour que les tests soient déterministes. */
export function meilleurCoup(
  p: Plateau,
  joueur: Joueur,
  profondeur: number,
  rand: (max: number) => number = (max) => Math.floor(Math.random() * max),
): number | null {
  const coups = coupsPossibles(p);
  if (coups.length === 0) return null;
  if (profondeur <= 0) return coups[rand(coups.length)];

  let meilleurs: number[] = [];
  let meilleureValeur = -Infinity;

  for (const coup of coups) {
    const valeur = -negamax(
      jouer(p, coup, joueur),
      adversaire(joueur),
      profondeur - 1,
      -Infinity,
      Infinity,
    );
    if (valeur > meilleureValeur) {
      meilleureValeur = valeur;
      meilleurs = [coup];
    } else if (valeur === meilleureValeur) {
      meilleurs.push(coup);
    }
  }

  // À valeur égale, tirer au sort : sinon l'adversaire rejoue la même partie à
  // l'identique, et il n'y a plus rien à découvrir.
  return meilleurs[rand(meilleurs.length)];
}
