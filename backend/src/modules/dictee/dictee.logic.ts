/** Logique pure du module dictée : constantes de niveau, tirage de la longueur d'une
 * séance, découpage d'un contenu en mots et normalisation d'un mot en clé de suivi.
 * Isolée ici pour être testée sans base ni NestJS. */

export const NIVEAUX = ['debutant', 'normal', 'difficile'] as const;
export type Niveau = (typeof NIVEAUX)[number];

export const LONGUEURS = ['courte', 'moyenne', 'longue'] as const;
export type Longueur = (typeof LONGUEURS)[number];

/** Nombre d'items servis pour un couple (niveau, longueur).
 * Débutant : des mots isolés, on en dicte plusieurs. Normal : des phrases.
 * Difficile : un paragraphe, deux tout au plus. */
const ITEM_COUNT: Record<Niveau, Record<Longueur, number>> = {
  debutant: { courte: 5, moyenne: 10, longue: 15 },
  normal: { courte: 1, moyenne: 2, longue: 3 },
  difficile: { courte: 1, moyenne: 1, longue: 2 },
};

export function isNiveau(value: unknown): value is Niveau {
  return (
    typeof value === 'string' && (NIVEAUX as readonly string[]).includes(value)
  );
}

export function isLongueur(value: unknown): value is Longueur {
  return (
    typeof value === 'string' &&
    (LONGUEURS as readonly string[]).includes(value)
  );
}

export function resolveItemCount(niveau: Niveau, longueur: Longueur): number {
  return ITEM_COUNT[niveau][longueur];
}

/** Caractères de ponctuation retirés en bord de mot (les apostrophes et traits d'union
 * internes sont conservés : « l'école », « arc-en-ciel » sont un seul mot). */
const EDGE_PUNCTUATION = /^[«»"'’“”().,;:!?…—–-]+|[«»"'’“”().,;:!?…—–-]+$/g;

/** Le mot débarrassé de la ponctuation de bord, casse et accents conservés :
 * « Chat. » → « Chat », « l'école » → « l'école ». Forme affichée dans les listes. */
export function cleanWord(token: string): string {
  return token.trim().replace(/’/g, "'").replace(EDGE_PUNCTUATION, '');
}

/** Clé de suivi d'un mot : `cleanWord` mis en minuscules. Deux écritures du même mot
 * produisent la même clé pour être agrégées sur l'année. '' si le token n'est que
 * de la ponctuation. */
export function normalizeWordKey(token: string): string {
  return cleanWord(token).toLowerCase();
}

export interface DicteeWord {
  /** Le mot tel qu'il apparaît dans le contenu, ponctuation de bord comprise. */
  raw: string;
  /** Forme affichée, ponctuation de bord retirée. */
  display: string;
  /** Sa clé de suivi normalisée. */
  key: string;
}

/** Découpe un contenu en mots. Les tokens purement ponctuation (une virgule isolée)
 * sont exclus : ils ne sont ni écrits ni cochés. */
export function extractWords(contenu: string): DicteeWord[] {
  return contenu
    .split(/\s+/)
    .filter(Boolean)
    .map((raw) => ({
      raw,
      display: cleanWord(raw),
      key: normalizeWordKey(raw),
    }))
    .filter((word) => word.key.length > 0);
}

/** Clés de mots distinctes couvertes par un lot d'items : c'est sur cet ensemble que le
 * suivi par mot s'incrémente (une fois par mot et par séance, pas une fois par occurrence). */
export function distinctWordKeys(contenus: string[]): string[] {
  const keys = new Set<string>();
  for (const contenu of contenus) {
    for (const word of extractWords(contenu)) keys.add(word.key);
  }
  return [...keys];
}

/** Garde les items qui travaillent la notion demandée. `notion` vide/absente = tous. */
export function filterByNotion<T extends { notions: string[] }>(
  items: T[],
  notion?: string | null,
): T[] {
  if (!notion) return items;
  return items.filter((item) => item.notions.includes(notion));
}
