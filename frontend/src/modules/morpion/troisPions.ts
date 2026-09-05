import type { Case, Joueur } from 'src/utils/plateau';

/**
 * Le morpion à TROIS PIONS.
 *
 * Chacun pose trois pions, puis les déplace, vers n'importe quelle case libre, jusqu'à
 * ce que l'un aligne. C'est un autre jeu que le morpion classique, et un meilleur : la
 * grille ne se remplit jamais, donc la partie ne s'éteint pas en match nul au neuvième
 * coup. Il faut regarder ce que l'adversaire prépare, pas seulement remplir.
 *
 * ── Pourquoi une résolution EXACTE, et pas le minimax voisin ─────────────────────────
 *
 * En phase de déplacement, chacun a neuf coups (trois pions × trois cases libres) et la
 * partie ne se termine pas d'elle-même : explorer neuf coups d'avance ferait 387 millions
 * de positions. Le minimax de `plateau.ts` devrait donc s'arrêter beaucoup plus tôt, et
 * un adversaire tronqué se ferait battre, alors que le pré-jeu promet « il ne perd
 * jamais » au niveau difficile.
 *
 * Mais le jeu est MINUSCULE : trois pions chacun sur neuf cases, c'est 2 744 positions de
 * déplacement. On les résout TOUTES, une fois, en quelques millisecondes. L'adversaire
 * difficile ne cherche alors plus rien : il lit la réponse.
 *
 * ── Le jeu boucle, et il faut le dire ────────────────────────────────────────────────
 *
 * C'est un jeu BOUCLANT : depuis une position, on peut revenir à la même. Un minimax
 * ordinaire y tournerait sans fin. La résolution se fait donc par POINT FIXE : on marque
 * gagnantes les positions d'où l'on force une victoire, perdantes celles d'où tout mène à
 * une défaite, et on recommence jusqu'à ce que plus rien ne change. Ce qui reste n'est ni
 * l'un ni l'autre : ce sont les positions où la partie tourne en rond, et c'est la vraie
 * définition du match nul ici.
 *
 * La partie complète est nulle si les deux jouent parfaitement (vérifié par un test) :
 * comme le morpion classique. Mais 400 positions de déplacement sont nulles PAR BOUCLE,
 * d'où la règle de répétition côté partie : sans elle, deux joueurs parfaits se
 * déplaceraient jusqu'à la fin des temps.
 */

export const PIONS_PAR_JOUEUR = 3;

export type Coup =
  | { type: 'pose'; vers: number }
  | { type: 'deplacement'; depuis: number; vers: number };

/** Les valeurs du moteur, et non un vocabulaire à nous : le pré-jeu commun parle en
 * `easy | medium | hard`, et traduire entre les deux n'ajouterait qu'un endroit où se
 * tromper. */
export type Niveau = 'easy' | 'medium' | 'hard';

export type Rand = (max: number) => number;

const TOUTES = 0x1ff; // les neuf cases

const LIGNES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
].map((ligne) => ligne.reduce((masque, c) => masque | (1 << c), 0));

const aligne = (masque: number): boolean =>
  LIGNES.some((ligne) => (masque & ligne) === ligne);

function cellules(masque: number): number[] {
  const out: number[] = [];
  for (let c = 0; c < 9; c++) if (masque & (1 << c)) out.push(c);
  return out;
}

function compter(masque: number): number {
  let n = 0;
  for (let m = masque; m; m >>= 1) n += m & 1;
  return n;
}

/** Les deux masques, joueur 1 puis joueur 2. */
function masques(cases: Case[]): [number, number] {
  let un = 0;
  let deux = 0;
  for (let c = 0; c < 9; c++) {
    if (cases[c] === 1) un |= 1 << c;
    else if (cases[c] === 2) deux |= 1 << c;
  }
  return [un, deux];
}

/** Pose-t-on encore, ou déplace-t-on ? Dérivé du plateau, jamais stocké : un compteur
 * séparé finirait par mentir sur ce que la grille montre. */
export function phase(cases: Case[]): 'pose' | 'deplacement' {
  const [un, deux] = masques(cases);
  return compter(un) + compter(deux) < PIONS_PAR_JOUEUR * 2
    ? 'pose'
    : 'deplacement';
}

export function coupsPossibles(cases: Case[], joueur: Joueur): Coup[] {
  const [un, deux] = masques(cases);
  const libres = ~(un | deux) & TOUTES;

  if (phase(cases) === 'pose') {
    return cellules(libres).map((vers) => ({ type: 'pose', vers }));
  }

  const miens = joueur === 1 ? un : deux;
  const coups: Coup[] = [];
  for (const depuis of cellules(miens)) {
    for (const vers of cellules(libres)) {
      coups.push({ type: 'deplacement', depuis, vers });
    }
  }
  return coups;
}

export function appliquer(cases: Case[], coup: Coup, joueur: Joueur): Case[] {
  const suivantes = [...cases];
  if (coup.type === 'deplacement') suivantes[coup.depuis] = 0;
  suivantes[coup.vers] = joueur;
  return suivantes;
}

// ─── La résolution exacte ─────────────────────────────────────────────────────

const GAGNANT = 1;
const PERDANT = 2;
const NUL = 0;

/** Valeur de chaque position de déplacement, DU POINT DE VUE DU JOUEUR AU TRAIT.
 *
 * Construite au premier usage seulement : une partie en facile ou en moyen n'en a pas
 * besoin, et le calcul, quelques millisecondes, n'a pas à peser au chargement du
 * module. */
let table: Uint8Array | null = null;

const cle = (un: number, deux: number, tour: 0 | 1): number =>
  (un << 10) | (deux << 1) | tour;

function resoudre(): Uint8Array {
  if (table) return table;

  const valeurs = new Uint8Array(512 * 1024);
  const positions: [number, number, 0 | 1][] = [];
  for (let un = 0; un < 512; un++) {
    if (compter(un) !== PIONS_PAR_JOUEUR || aligne(un)) continue;
    for (let deux = 0; deux < 512; deux++) {
      if (compter(deux) !== PIONS_PAR_JOUEUR || (un & deux) || aligne(deux)) {
        continue;
      }
      positions.push([un, deux, 0], [un, deux, 1]);
    }
  }

  // Point fixe : on ne promeut que « inconnu → gagnant/perdant », jamais l'inverse. Ce
  // qui reste inconnu à la fin est nul par boucle : c'est exactement ce qu'on veut.
  let change = true;
  while (change) {
    change = false;
    for (const [un, deux, tour] of positions) {
      const k = cle(un, deux, tour);
      if (valeurs[k] !== NUL) continue;

      const miens = tour === 0 ? un : deux;
      const siens = tour === 0 ? deux : un;
      const libres = ~(un | deux) & TOUTES;

      let toutesGagnantesPourLui = true;
      let uneQuiPerdPourLui = false;

      for (const depuis of cellules(miens)) {
        for (const vers of cellules(libres)) {
          const apres = (miens & ~(1 << depuis)) | (1 << vers);
          if (aligne(apres)) {
            uneQuiPerdPourLui = true;
            break;
          }
          const suivantUn = tour === 0 ? apres : siens;
          const suivantDeux = tour === 0 ? siens : apres;
          const v = valeurs[cle(suivantUn, suivantDeux, tour === 0 ? 1 : 0)];
          if (v === PERDANT) {
            uneQuiPerdPourLui = true;
            break;
          }
          if (v !== GAGNANT) toutesGagnantesPourLui = false;
        }
        if (uneQuiPerdPourLui) break;
      }

      if (uneQuiPerdPourLui) {
        valeurs[k] = GAGNANT;
        change = true;
      } else if (toutesGagnantesPourLui) {
        valeurs[k] = PERDANT;
        change = true;
      }
    }
  }

  table = valeurs;
  return valeurs;
}

/** +1 je gagne de force · 0 nulle · −1 je perds de force, pour le joueur au trait. */
function valeurDeplacement(un: number, deux: number, tour: 0 | 1): number {
  const v = resoudre()[cle(un, deux, tour)];
  return v === GAGNANT ? 1 : v === PERDANT ? -1 : 0;
}

const memoPose = new Map<number, number>();

/** La phase de pose est un arbre FINI : un minimax mémorisé suffit, et il débouche sur
 * la table des déplacements.
 *
 * `tour` est un PARAMÈTRE et non une déduction depuis le nombre de pions posés. C'était
 * une déduction, et elle rendait la fonction sourde au joueur qu'on lui nommait : elle
 * répondait pour l'autre sans le dire. En jeu l'alternance est stricte, donc l'erreur ne
 * se voyait pas : un test l'a même « validée » par hasard. Un paramètre coûte un entier
 * et supprime la classe entière de bêtise. */
function valeurPose(
  un: number,
  deux: number,
  poses: number,
  tour: 0 | 1,
): number {
  if (poses === PIONS_PAR_JOUEUR * 2) return valeurDeplacement(un, deux, tour);

  const k = (un << 15) | (deux << 6) | (poses << 1) | tour;
  const memo = memoPose.get(k);
  if (memo !== undefined) return memo;

  const libres = ~(un | deux) & TOUTES;
  let meilleure = -2;
  for (const c of cellules(libres)) {
    const suivantUn = tour === 0 ? un | (1 << c) : un;
    const suivantDeux = tour === 0 ? deux : deux | (1 << c);
    const valeur = aligne(tour === 0 ? suivantUn : suivantDeux)
      ? 1
      : -valeurPose(suivantUn, suivantDeux, poses + 1, tour === 0 ? 1 : 0);
    if (valeur > meilleure) meilleure = valeur;
  }

  memoPose.set(k, meilleure);
  return meilleure;
}

/** La valeur d'une position, DU POINT DE VUE DU JOUEUR NOMMÉ, qu'on suppose au trait :
 * +1 il gagne de force, 0 nulle, −1 il perd de force.
 *
 * Une position déjà alignée n'a pas de valeur : la partie est finie, personne n'est au
 * trait. On rend alors ±1 selon qui a aligné, plutôt que d'explorer une suite qui
 * n'existe pas. Exposée pour les tests : c'est elle qui dit que la partie complète est
 * nulle. */
export function valeur(cases: Case[], joueur: Joueur): number {
  const [un, deux] = masques(cases);
  if (aligne(un)) return joueur === 1 ? 1 : -1;
  if (aligne(deux)) return joueur === 2 ? 1 : -1;

  const tour: 0 | 1 = joueur === 1 ? 0 : 1;
  const poses = compter(un) + compter(deux);
  return poses < PIONS_PAR_JOUEUR * 2
    ? valeurPose(un, deux, poses, tour)
    : valeurDeplacement(un, deux, tour);
}

// ─── L'adversaire ─────────────────────────────────────────────────────────────

const autre = (joueur: Joueur): Joueur => (joueur === 1 ? 2 : 1);

const gagne = (cases: Case[], joueur: Joueur): boolean => {
  const [un, deux] = masques(cases);
  return aligne(joueur === 1 ? un : deux);
};

/** Minimax à deux demi-coups, sans évaluation : ce qui donne exactement « il gagne s'il
 * peut, il bloque s'il doit ». C'est la définition du niveau moyen, et ça la rend
 * vérifiable : pas une profondeur choisie au jugé. */
function coupMoyen(cases: Case[], joueur: Joueur, rand: Rand): Coup | null {
  const coups = coupsPossibles(cases, joueur);
  if (coups.length === 0) return null;

  let meilleurs: Coup[] = [];
  let meilleure = -Infinity;

  for (const coup of coups) {
    const apres = appliquer(cases, coup, joueur);
    let valeurDuCoup = 0;
    if (gagne(apres, joueur)) {
      valeurDuCoup = 1;
    } else {
      const riposte = coupsPossibles(apres, autre(joueur)).some((r) =>
        gagne(appliquer(apres, r, autre(joueur)), autre(joueur)),
      );
      if (riposte) valeurDuCoup = -1;
    }

    if (valeurDuCoup > meilleure) {
      meilleure = valeurDuCoup;
      meilleurs = [coup];
    } else if (valeurDuCoup === meilleure) {
      meilleurs.push(coup);
    }
  }

  return meilleurs[rand(meilleurs.length)];
}

/** Le coup de l'adversaire.
 *
 * En difficile, il joue la valeur exacte, et, à valeur égale, il PRÉFÈRE gagner vite :
 * sans ce départage, un adversaire qui gagne de force peut tourner indéfiniment autour
 * de sa victoire, ce qui ressemble à un bug. */
export function meilleurCoup(
  cases: Case[],
  joueur: Joueur,
  niveau: Niveau,
  rand: Rand = (max) => Math.floor(Math.random() * max),
): Coup | null {
  const coups = coupsPossibles(cases, joueur);
  if (coups.length === 0) return null;
  if (niveau === 'easy') return coups[rand(coups.length)];
  if (niveau === 'medium') return coupMoyen(cases, joueur, rand);

  let meilleurs: Coup[] = [];
  let meilleure = -Infinity;
  for (const coup of coups) {
    const apres = appliquer(cases, coup, joueur);
    // Aligner met fin à la partie : cette valeur ne se lit dans aucune table.
    const valeurDuCoup = gagne(apres, joueur)
      ? 2
      : -valeur(apres, autre(joueur));
    if (valeurDuCoup > meilleure) {
      meilleure = valeurDuCoup;
      meilleurs = [coup];
    } else if (valeurDuCoup === meilleure) {
      meilleurs.push(coup);
    }
  }

  return meilleurs[rand(meilleurs.length)];
}
