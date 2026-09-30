/**
 * Le solfège, côté serveur : de quoi composer une feuille d'exercices.
 *
 * ── Pourquoi c'est écrit deux fois ───────────────────────────────────────────────────
 *
 * La même chose existe en `frontend/src/musique/solfege.ts`. Ce n'est pas un oubli : les
 * deux paquets n'ont aucune dépendance entre eux, et le jeu se joue entièrement dans le
 * navigateur alors que la feuille imprimée se compose ici, comme pour tous les autres
 * modules.
 *
 * Ce qui est dupliqué, ce sont des FAITS : les sept noms de notes, les deux degrés que
 * les clés posent sur la ligne du bas, et la durée de chaque figure avec le nom de son
 * silence. Ils ne changeront jamais. Ce qui pourrait diverger, en revanche, c'est une
 * faute de frappe d'un seul côté, et elle serait silencieuse : la feuille imprimée
 * nommerait une note autrement que l'écran.
 *
 * Un test croisé compare donc les deux fichiers sur disque et refuse qu'ils s'éloignent :
 * `frontend/src/__tests__/solfege-faits.test.ts`.
 */

export const NOTES = ['do', 'ré', 'mi', 'fa', 'sol', 'la', 'si'] as const;
export type Note = (typeof NOTES)[number];

export type Cle = 'sol' | 'fa';

export function degre(octave: number, rang: number): number {
  return octave * 7 + rang;
}

export function nomDe(hauteur: number): Note {
  return NOTES[((hauteur % 7) + 7) % 7];
}

/** Le degré posé sur la LIGNE DU BAS, pour chaque clé. Ce sont ces deux nombres, et eux
 * seuls, qui font que le même dessin ne se lit pas pareil. */
const BASE: Record<Cle, number> = {
  sol: degre(4, 2), // mi, celui qui est juste au-dessus du do du milieu
  fa: degre(2, 4), // sol, deux octaves plus bas
};

export function hauteurDe(position: number, cle: Cle): number {
  return position + BASE[cle];
}

/** Les positions qu'on s'autorise à écrire : la portée, plus `etendue` lignes de chaque
 * côté. */
export function positionsPermises(etendue: number): number[] {
  const bas = -2 * etendue;
  const haut = 8 + 2 * etendue;
  return Array.from({ length: haut - bas + 1 }, (_, i) => bas + i);
}

// ─── Les durées ──────────────────────────────────────────────────────────────

export const FIGURES = {
  ronde: { temps: 4, silence: 'pause' },
  blanche: { temps: 2, silence: 'demi-pause' },
  noire: { temps: 1, silence: 'soupir' },
  croche: { temps: 0.5, silence: 'demi-soupir' },
  doubleCroche: { temps: 0.25, silence: 'quart de soupir' },
} as const;

export type Figure = keyof typeof FIGURES;

export const ORDRE_FIGURES: readonly Figure[] = [
  'ronde',
  'blanche',
  'noire',
  'croche',
  'doubleCroche',
];

export const NOM_FIGURE: Record<Figure, string> = {
  ronde: 'ronde',
  blanche: 'blanche',
  noire: 'noire',
  croche: 'croche',
  doubleCroche: 'double croche',
};

export function temps(figure: Figure): number {
  return FIGURES[figure].temps;
}

export function nomDeFigure(figure: Figure, silence: boolean): string {
  return silence ? FIGURES[figure].silence : NOM_FIGURE[figure];
}

export interface Evenement {
  figure: Figure;
  silence: boolean;
}

/**
 * Le langage rythmique de sa méthode : une syllabe PAR TEMPS.
 *
 * `Taé` sur l'attaque, `aé` sur le temps qui prolonge, `Aé` sur le temps qui se tait.
 * Rien en dessous du temps : les croches n'ont pas encore été vues en cours, et leur
 * syllabe ne se devine pas.
 */
export function syllabes(evenement: Evenement): string {
  const duree = temps(evenement.figure);
  if (duree < 1) return '';
  const battements = Math.round(duree);
  if (evenement.silence) return 'Aé'.repeat(battements);
  return 'Taé' + 'aé'.repeat(battements - 1);
}

// ─── Composer ────────────────────────────────────────────────────────────────

export type Rand = (min: number, max: number) => number;

function tirer<T>(liste: readonly T[], rand: Rand): T {
  return liste[rand(0, liste.length - 1)];
}

/**
 * Une mesure qui tombe JUSTE, construite par le haut.
 *
 * On part du temps restant et on ne propose que ce qui y tient : la mesure est juste par
 * construction. La noire sert de dernier recours, car certaines combinaisons ne peuvent
 * pas remplir la mesure : une ronde et une blanche ne feront jamais trois temps.
 *
 * Aucun silence de plus d'un temps : la lecture rythmique s'écrit sur UNE ligne, où la
 * pause et la demi-pause sont le même rectangle et où seule la ligne à laquelle il
 * s'accroche les distingue.
 */
export function remplirMesure(
  figures: Figure[],
  mesure: number,
  rand: Rand,
): Evenement[] {
  const evenements: Evenement[] = [];
  let reste = mesure;
  const possibles = [...figures].sort((a, b) => temps(b) - temps(a));

  while (reste > 1e-9) {
    const tenables = possibles.filter((f) => temps(f) <= reste + 1e-9);
    const figure: Figure =
      tenables.length > 0 ? tirer(tenables, rand) : 'noire';
    const silence =
      evenements.length > 0 && temps(figure) <= 1 && rand(0, 2) === 0;
    evenements.push({ figure, silence });
    reste -= temps(figure);
  }
  return evenements;
}

/** Une phrase de plusieurs mesures, avec les barres qui les séparent. */
export function remplirPhrase(
  figures: Figure[],
  mesure: number,
  combienDeTemps: number,
  rand: Rand,
): { evenements: Evenement[]; barres: number[] } {
  const mesures = Math.max(1, Math.round(combienDeTemps / mesure));
  const evenements: Evenement[] = [];
  const barres: number[] = [];
  for (let m = 0; m < mesures; m++) {
    evenements.push(...remplirMesure(figures, mesure, rand));
    if (m < mesures - 1) barres.push(evenements.length - 1);
  }
  // Une phrase ne se termine pas sur un silence : on ne saurait pas si elle est finie.
  const derniere = evenements[evenements.length - 1];
  if (derniere.silence) derniere.silence = false;
  return { evenements, barres };
}
