/** Les positions du tableau de numération, des millions aux millièmes.
 *
 * ── Pourquoi un exposant, et pas une valeur ───────────────────────────────────────────
 *
 * Le module travaillait en `POSITION_VALUE[p]` (1, 10, 100…) et en nombres entiers. Les
 * décimaux n'y entrent pas : représenter 3,45 en flottant fait échouer les comparaisons
 * sur des arrondis, et la comparaison des décimaux EST la notion : un enfant qui croit
 * que 3,45 > 3,5 parce que 45 > 5 fait l'erreur classique du CM1.
 *
 * Chaque position porte donc un EXPOSANT relatif à l'unité : centaine = 2, dixième = −1.
 * Les nombres circulent en entiers, exprimés dans l'unité la plus petite en jeu : avec les
 * centièmes ouverts, 3,45 est l'entier 345. Toute l'arithmétique reste exacte, et
 * l'affichage n'insère la virgule qu'au dernier moment.
 *
 * Le `niveau` est une ÉTIQUETTE affichée en administration pour savoir quand ouvrir une
 * position. C'est la liste des positions actives qui décide, comme avant.
 */

import type { Niveau } from '../../common/niveau';

export type PositionKey =
  // Décimaux
  | 'millieme'
  | 'centieme'
  | 'dixieme'
  // Entiers
  | 'u'
  | 'd'
  | 'c'
  | 'm'
  | 'dm'
  | 'cm'
  | 'mi'
  | 'dmi'
  | 'cmi';

export interface PositionMeta {
  key: PositionKey;
  /** Puissance de dix, relative à l'unité. Centaine = 2, dixième = −1. */
  exposant: number;
  /** Le nom au pluriel, tel qu'il apparaît dans la question. */
  nom: string;
  /** Le libellé de l'administration, avec sa plage. */
  label: string;
  niveau: Niveau;
  defaultActive: boolean;
}

/** Du plus petit au plus grand. L'ordre porte les comparaisons, ne pas le trier autrement. */
export const POSITIONS: PositionMeta[] = [
  {
    key: 'millieme',
    exposant: -3,
    nom: 'millièmes',
    label: 'Millièmes (0,001)',
    niveau: 'cm2',
    defaultActive: false,
  },
  {
    key: 'centieme',
    exposant: -2,
    nom: 'centièmes',
    label: 'Centièmes (0,01)',
    niveau: 'cm1',
    defaultActive: false,
  },
  {
    key: 'dixieme',
    exposant: -1,
    nom: 'dixièmes',
    label: 'Dixièmes (0,1)',
    niveau: 'cm1',
    defaultActive: false,
  },
  {
    key: 'u',
    exposant: 0,
    nom: 'unités',
    label: 'Unités (1–9)',
    niveau: 'cp',
    defaultActive: true,
  },
  {
    key: 'd',
    exposant: 1,
    nom: 'dizaines',
    label: 'Dizaines (10–99)',
    niveau: 'cp',
    defaultActive: true,
  },
  {
    key: 'c',
    exposant: 2,
    nom: 'centaines',
    label: 'Centaines (100–999)',
    niveau: 'ce1',
    defaultActive: false,
  },
  {
    key: 'm',
    exposant: 3,
    nom: 'milliers',
    label: 'Milliers (1 000–9 999)',
    niveau: 'ce2',
    defaultActive: false,
  },
  {
    key: 'dm',
    exposant: 4,
    nom: 'dizaines de milliers',
    label: 'Diz. de milliers (10 000–99 999)',
    niveau: 'ce2',
    defaultActive: false,
  },
  {
    key: 'cm',
    exposant: 5,
    nom: 'centaines de milliers',
    label: 'Cent. de milliers (100 000–999 999)',
    niveau: 'cm1',
    defaultActive: false,
  },
  {
    key: 'mi',
    exposant: 6,
    nom: 'millions',
    label: 'Millions',
    niveau: 'cm1',
    defaultActive: false,
  },
  {
    key: 'dmi',
    exposant: 7,
    nom: 'dizaines de millions',
    label: 'Diz. de millions',
    niveau: 'cm2',
    defaultActive: false,
  },
  {
    key: 'cmi',
    exposant: 8,
    nom: 'centaines de millions',
    label: 'Cent. de millions',
    niveau: 'cm2',
    defaultActive: false,
  },
];

const BY_KEY = new Map(POSITIONS.map((p) => [p.key, p]));

export const POSITION_KEYS: PositionKey[] = POSITIONS.map((p) => p.key);

export const DEFAULT_ACTIVE_POSITIONS: PositionKey[] = POSITIONS.filter(
  (p) => p.defaultActive,
).map((p) => p.key);

export function isPositionKey(value: unknown): value is PositionKey {
  return typeof value === 'string' && BY_KEY.has(value as PositionKey);
}

export function getPosition(key: PositionKey): PositionMeta {
  const position = BY_KEY.get(key);
  if (!position) throw new Error(`Position inconnue : ${key}`);
  return position;
}

/** Trie des positions de la plus petite à la plus grande. */
export function trierPositions(positions: PositionKey[]): PositionKey[] {
  return [...positions].sort(
    (a, b) => getPosition(a).exposant - getPosition(b).exposant,
  );
}

// ─── Arithmétique entière ───────────────────────────────────────────────────

/** Le plus petit exposant en jeu : c'est l'unité dans laquelle tous les entiers du module
 * sont exprimés. Sans décimale ouverte, il vaut 0 et rien ne change. */
export function exposantMin(positions: PositionKey[]): number {
  return Math.min(...positions.map((p) => getPosition(p).exposant));
}

/** Combien d'unités de base vaut cette position. Toujours un entier ≥ 1. */
export function pas(position: PositionKey, minExposant: number): number {
  return 10 ** (getPosition(position).exposant - minExposant);
}

/** Le plus grand entier représentable avec ces positions, en unités de base. */
export function maximum(positions: PositionKey[]): number {
  const min = exposantMin(positions);
  const haute = trierPositions(positions).at(-1)!;
  return pas(haute, min) * 10 - 1;
}

/** Le chiffre porté par une position, dans un entier exprimé en unités de base. */
export function chiffreA(
  valeur: number,
  position: PositionKey,
  minExposant: number,
): number {
  return Math.floor(valeur / pas(position, minExposant)) % 10;
}

/** Le nombre tel qu'il s'écrit, virgule française comprise.
 *
 * L'entier ne devient un décimal qu'ICI : `formater(345, -2)` rend « 3,45 ». Les zéros de
 * tête de la partie décimale comptent : 305 centièmes s'écrit « 3,05 » et non « 3,5 ». */
export function formater(valeur: number, minExposant: number): string {
  if (minExposant >= 0) return String(valeur * 10 ** minExposant);

  const decimales = -minExposant;
  const facteur = 10 ** decimales;
  const entiere = Math.floor(valeur / facteur);
  const fraction = valeur % facteur;
  return `${entiere},${String(fraction).padStart(decimales, '0')}`;
}
