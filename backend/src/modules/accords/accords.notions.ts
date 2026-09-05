/** Les cinq notions du module, dans l'ordre des fiches de `cours/francais/accords.tsx`.
 *
 * Cet ordre est pédagogique et raconte une histoire : de quoi un nom est marqué (genre,
 * nombre), comment l'adjectif recopie ces marques, puis les deux accords qu'on demande
 * vraiment à l'école. Une notion ne vient jamais avant celles dont elle a besoin.
 *
 * Ici la notion et le type d'exercice COÏNCIDENT, un exercice par notion, contrairement
 * au module grammaire où quatre types d'exercice se partagent dix notions. C'est ce qui
 * permet de n'avoir qu'une seule énumération.
 */

export type NotionKey =
  | 'genre_nom'
  | 'nombre_nom'
  | 'accord_adjectif'
  | 'accord_gn'
  | 'accord_sujet_verbe';

export interface NotionMeta {
  key: NotionKey;
  /** Titre de la fiche, et libellé du tableau d'administration. */
  label: string;
  /** La consigne donnée à l'enfant. */
  consigne: string;
  /** Le socle : ce qui marque un nom, avant les accords proprement dits. */
  defaultActive: boolean;
}

export const NOTIONS: NotionMeta[] = [
  {
    key: 'genre_nom',
    label: 'Le genre des noms',
    consigne: 'Masculin ou féminin ? Choisis le déterminant.',
    defaultActive: true,
  },
  {
    key: 'nombre_nom',
    label: 'Le nombre des noms',
    consigne: 'Écris ce nom au pluriel.',
    defaultActive: true,
  },
  {
    key: 'accord_adjectif',
    label: "L'accord de l'adjectif",
    consigne: "Accorde l'adjectif avec le nom.",
    defaultActive: true,
  },
  {
    key: 'accord_gn',
    label: "L'accord dans le groupe nominal",
    consigne: 'Écris tout le groupe nominal au pluriel.',
    defaultActive: false,
  },
  {
    key: 'accord_sujet_verbe',
    label: "L'accord sujet-verbe",
    consigne: 'Quelle est la bonne forme du verbe ?',
    defaultActive: false,
  },
];

const BY_KEY = new Map(NOTIONS.map((notion) => [notion.key, notion]));

export const NOTION_KEYS: NotionKey[] = NOTIONS.map((notion) => notion.key);

export const DEFAULT_ACTIVE_NOTIONS: NotionKey[] = NOTIONS.filter(
  (notion) => notion.defaultActive,
).map((notion) => notion.key);

export function isNotionKey(value: unknown): value is NotionKey {
  return typeof value === 'string' && BY_KEY.has(value as NotionKey);
}

export function getNotion(key: NotionKey): NotionMeta {
  const notion = BY_KEY.get(key);
  if (!notion) throw new Error(`Notion inconnue : ${key}`);
  return notion;
}
