/**
 * Le solfège : où se pose une note, combien de temps elle dure, et comment ça s'appelle.
 *
 * Rien ici ne dessine ni ne sonne. C'est le vocabulaire commun aux deux modules, solfège
 * et batterie, parce qu'une portée de batterie est une portée, et qu'un rythme de
 * batterie est un rythme.
 *
 * ── La seule idée à comprendre ───────────────────────────────────────────────────────
 *
 * Une note n'a pas de position propre. Elle a un DEGRÉ (sa hauteur, un nombre qui monte
 * de un à chaque note de l'échelle), et la CLÉ décide quel degré se pose sur la ligne du
 * bas. Le reste n'est que de l'addition. C'est aussi pour cela qu'un même dessin se lit
 * différemment selon la clé : le dessin ne dit que la position, jamais le nom.
 */

/** Les sept noms, dans l'ordre où ils montent. L'échelle boucle : après `si`, `do`. */
export const NOTES = ['do', 'ré', 'mi', 'fa', 'sol', 'la', 'si'] as const;
export type Note = (typeof NOTES)[number];

/**
 * `rythme` n'est pas une clé : c'est une portée d'UNE SEULE LIGNE, celle sur laquelle sa
 * méthode écrit la lecture rythmique. Il n'y a aucune hauteur à lire, seulement des
 * durées, et cinq lignes ne feraient que suggérer des notes qui n'existent pas.
 */
export type Cle = 'sol' | 'fa' | 'percussion' | 'rythme';

/** Les clés qui portent des HAUTEURS. Les deux autres n'en portent pas : une batterie a
 * des fûts, une lecture rythmique n'a que des durées. */
export type CleLue = 'sol' | 'fa';

/**
 * Le degré d'une note : son rang absolu dans l'échelle, toutes octaves confondues.
 *
 * `degre(4, 0)` est le do du milieu du clavier. Monter d'un degré, c'est monter d'un nom
 * et d'une case sur la portée : c'est ce qui rend tout le reste calculable.
 */
export function degre(octave: number, rang: number): number {
  return octave * 7 + rang;
}

/** Le nom d'un degré, sans son octave : c'est tout ce qu'on lui demande de dire. */
export function nomDe(hauteur: number): Note {
  return NOTES[((hauteur % 7) + 7) % 7];
}

/**
 * Le degré posé sur la LIGNE DU BAS de la portée, pour chaque clé.
 *
 * Clé de sol : la ligne du bas porte un mi, et le sol de la clé se pose sur la deuxième.
 * Clé de fa : la ligne du bas porte un sol, et le fa de la clé sur la quatrième.
 * Ce sont ces deux nombres, et eux seuls, qui font que la même note se lit autrement.
 */
const BASE: Record<CleLue, number> = {
  sol: degre(4, 2), // mi, celui qui est juste au-dessus du do du milieu
  fa: degre(2, 4), // sol, deux octaves plus bas
};

/**
 * La hauteur d'une note sur la portée, comptée en demi-interlignes depuis la ligne du bas.
 *
 * `0` est la ligne du bas, `1` l'interligne juste au-dessus, `8` la ligne du haut. Les
 * valeurs négatives et au-delà de huit sortent de la portée : ce sont les lignes
 * supplémentaires, celles qu'on ajoute au crayon.
 */
export function positionDe(hauteur: number, cle: CleLue): number {
  return hauteur - BASE[cle];
}

/** L'inverse : quelle note se lit à cette position, dans cette clé. */
export function hauteurDe(position: number, cle: CleLue): number {
  return position + BASE[cle];
}

/** Une position paire tombe SUR une ligne, une impaire entre deux. */
export function surUneLigne(position: number): boolean {
  return position % 2 === 0;
}

/**
 * Les lignes supplémentaires à tracer pour atteindre cette position.
 *
 * Une note au-dessus ou en dessous de la portée ne flotte pas dans le vide : on prolonge
 * la portée d'un petit trait par ligne franchie, sinon on ne sait plus compter les cases.
 * Une note dans un interligne hors portée fait tracer la ligne juste en dessous d'elle
 * (ou au-dessus, selon le côté), pas la sienne, qui n'existe pas.
 */
export function lignesSupplementaires(position: number): number[] {
  const lignes: number[] = [];
  for (let y = -2; y >= position; y -= 2) lignes.push(y);
  for (let y = 10; y <= position; y += 2) lignes.push(y);
  return lignes;
}

// ─── Les durées ──────────────────────────────────────────────────────────────

/**
 * Les figures, et leur silence jumeau.
 *
 * Chaque durée existe en deux versions : une qui sonne, une qui se tait. C'est tout le
 * système, et c'est ce qui échappe le plus longtemps : « soupir » n'est pas une note
 * bizarre, c'est le silence qui dure exactement ce que dure une noire.
 *
 * Les durées sont comptées en TEMPS, la noire valant un temps. C'est la convention des
 * mesures à quatre temps, celles de la première année.
 */
export const FIGURES = {
  ronde: { temps: 4, silence: 'pause', crochets: 0 },
  blanche: { temps: 2, silence: 'demi-pause', crochets: 0 },
  noire: { temps: 1, silence: 'soupir', crochets: 0 },
  croche: { temps: 0.5, silence: 'demi-soupir', crochets: 1 },
  doubleCroche: { temps: 0.25, silence: 'quart de soupir', crochets: 2 },
} as const;

export type Figure = keyof typeof FIGURES;
export const ORDRE_FIGURES: readonly Figure[] = [
  'ronde',
  'blanche',
  'noire',
  'croche',
  'doubleCroche',
];

/** Le nom qu'on prononce : « double croche » s'écrit en deux mots, pas en chameau. */
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

export function nomSilence(figure: Figure): string {
  return FIGURES[figure].silence;
}

// ─── Les mesures ─────────────────────────────────────────────────────────────

/** Un évènement de rythme : une figure, qui sonne ou qui se tait. */
export interface Evenement {
  figure: Figure;
  silence: boolean;
}

export const MESURES = [2, 3, 4] as const;
export type Mesure = (typeof MESURES)[number];

export function dureeTotale(evenements: Evenement[]): number {
  return evenements.reduce((somme, e) => somme + temps(e.figure), 0);
}

/** Une mesure est juste quand elle fait exactement le nombre de temps annoncé. */
export function mesureJuste(evenements: Evenement[], mesure: Mesure): boolean {
  return Math.abs(dureeTotale(evenements) - mesure) < 1e-9;
}

/**
 * Le rang de chaque évènement, en temps depuis le début : c'est l'instant où il tombe.
 *
 * Sert au métronome comme au tapotement : pour savoir si elle a tapé à l'heure, il faut
 * d'abord savoir quand c'était l'heure.
 */
/**
 * Le langage rythmique de son cours : « Taé », « aé », « Aé ».
 *
 * Une syllabe PAR TEMPS, et non par figure, ce qui est la clé du système :
 *   - `Taé` : le temps où la note attaque
 *   - `aé`  : un temps qui prolonge celui d'avant, d'où `Taéaé` pour une blanche
 *   - `Aé`  : un temps qui se tait
 *
 * Les syllabes ne s'inventent pas : elles changent d'une méthode à l'autre, et en poser
 * d'autres que celles de sa classe travaillerait contre sa professeure. Celles-ci sont
 * relevées sur son cahier, leçons 1 et 2.
 *
 * Rien n'est rendu en dessous du temps : les croches n'ont pas encore été vues, et leur
 * syllabe se devine encore moins que les autres.
 */
export function syllabes(evenement: Evenement): string {
  const duree = temps(evenement.figure);
  if (duree < 1) return '';
  const battements = Math.round(duree);
  if (evenement.silence) return 'Aé'.repeat(battements);
  return 'Taé' + 'aé'.repeat(battements - 1);
}

export function instants(evenements: Evenement[]): number[] {
  let couru = 0;
  return evenements.map((e) => {
    const debut = couru;
    couru += temps(e.figure);
    return debut;
  });
}
