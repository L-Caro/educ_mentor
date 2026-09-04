/** Le vocabulaire grammatical du module, et lui seul.
 *
 * Deux dimensions que le CE1 apprend justement à ne pas confondre :
 *   la NATURE ne change jamais — « chat » est un nom dans toutes les phrases ;
 *   la FONCTION dépend de la phrase — le même groupe est sujet ici, complément là.
 *
 * Les libellés sont ceux des fiches de `cours/francais/` : l'enfant ne doit pas
 * rencontrer deux mots différents pour la même notion selon qu'elle joue ou qu'elle lit.
 */

export type Nature =
  | 'nom_commun'
  | 'nom_propre'
  | 'verbe'
  | 'determinant'
  | 'adjectif'
  | 'pronom_sujet'
  | 'invariable';

export type Fonction = 'sujet' | 'complement';

/** Ce qui est activable en administration, et ce qui est suivi en progression. */
export type NotionKey = Nature | Fonction | 'groupe_nominal';

export interface NotionMeta {
  key: NotionKey;
  /** `nature` = ce que le mot EST ; `fonction` = ce qu'il FAIT dans la phrase. */
  categorie: 'nature' | 'fonction';
  /** Réponse de QCM : « un verbe », « un déterminant ». */
  label: string;
  /** Consigne au singulier : « Touche le verbe. » */
  singulier: string;
  /** Consigne au pluriel : « Touche tous les verbes. » */
  pluriel: string;
  /** Le socle du début de CE1 — le reste s'active au fil du programme. */
  defaultActive: boolean;
}

export const NOTIONS: NotionMeta[] = [
  {
    key: 'nom_commun',
    categorie: 'nature',
    label: 'un nom commun',
    singulier: 'le nom commun',
    pluriel: 'tous les noms communs',
    defaultActive: true,
  },
  {
    key: 'nom_propre',
    categorie: 'nature',
    label: 'un nom propre',
    singulier: 'le nom propre',
    pluriel: 'tous les noms propres',
    defaultActive: true,
  },
  {
    key: 'verbe',
    categorie: 'nature',
    label: 'un verbe',
    singulier: 'le verbe',
    pluriel: 'les verbes',
    defaultActive: true,
  },
  {
    key: 'determinant',
    categorie: 'nature',
    label: 'un déterminant',
    singulier: 'le déterminant',
    pluriel: 'tous les déterminants',
    defaultActive: true,
  },
  {
    key: 'adjectif',
    categorie: 'nature',
    label: 'un adjectif',
    singulier: "l'adjectif",
    pluriel: 'tous les adjectifs',
    defaultActive: true,
  },
  {
    key: 'pronom_sujet',
    categorie: 'nature',
    label: 'un pronom',
    singulier: 'le pronom',
    pluriel: 'les pronoms',
    defaultActive: false,
  },
  {
    key: 'invariable',
    categorie: 'nature',
    label: 'un mot invariable',
    singulier: 'le mot invariable',
    pluriel: 'tous les mots invariables',
    defaultActive: false,
  },
  {
    key: 'groupe_nominal',
    categorie: 'fonction',
    label: 'un groupe nominal',
    singulier: 'le groupe nominal',
    pluriel: 'les groupes nominaux',
    defaultActive: false,
  },
  {
    key: 'sujet',
    categorie: 'fonction',
    label: 'le sujet',
    singulier: 'le sujet du verbe',
    pluriel: 'les sujets',
    defaultActive: false,
  },
  {
    key: 'complement',
    categorie: 'fonction',
    label: 'un complément',
    singulier: 'le complément',
    pluriel: 'les compléments',
    defaultActive: false,
  },
];

const BY_KEY = new Map(NOTIONS.map((notion) => [notion.key, notion]));

/** Les natures, dans l'ordre des fiches — c'est l'ordre du programme, pas l'alphabet. */
export const NATURES: Nature[] = NOTIONS.filter(
  (notion) => notion.categorie === 'nature',
).map((notion) => notion.key as Nature);

export const NOTION_KEYS: NotionKey[] = NOTIONS.map((notion) => notion.key);

export const DEFAULT_ACTIVE_NOTIONS: NotionKey[] = NOTIONS.filter(
  (notion) => notion.defaultActive,
).map((notion) => notion.key);

export function isNotionKey(value: unknown): value is NotionKey {
  return typeof value === 'string' && BY_KEY.has(value as NotionKey);
}

export function isNature(value: unknown): value is Nature {
  return isNotionKey(value) && BY_KEY.get(value)!.categorie === 'nature';
}

export function getNotion(key: NotionKey): NotionMeta {
  const notion = BY_KEY.get(key);
  if (!notion) throw new Error(`Notion inconnue : ${key}`);
  return notion;
}

/** « Touche le verbe. » ou « Touche tous les déterminants. », selon le nombre visé. */
export function consigne(key: NotionKey, count: number): string {
  const notion = getNotion(key);
  return `Touche ${count === 1 ? notion.singulier : notion.pluriel}.`;
}
