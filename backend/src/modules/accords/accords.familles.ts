/** Les familles morphologiques, et la classe où chacune s'apprend.
 *
 * Le corpus va jusqu'au CM2 : il contient les pluriels en -aux, les féminins irréguliers,
 * les adjectifs invariables au masculin pluriel. Tout cela est PRÉSENT mais FERMÉ — on
 * ouvre une famille depuis l'administration quand la classe l'a vue, comme les figures de
 * la géométrie ou les temps de la conjugaison.
 *
 * La famille d'un mot est DÉRIVÉE de ses formes, jamais annotée : « cheval / chevaux » est
 * un pluriel en -aux parce qu'il se termine par -aux, pas parce qu'on l'a écrit quelque
 * part. Une annotation à la main serait une occasion de plus de se tromper, et le corpus
 * en a déjà assez.
 *
 * Le `niveau` est une ÉTIQUETTE affichée en administration pour savoir quand ouvrir. Il
 * n'ouvre rien de lui-même.
 */

import type { Niveau } from '../../common/niveau';
import type { AdjectifMeta, NomMeta } from './accords.corpus';

export type FamilleKey =
  // Pluriel des noms
  | 'pluriel_s'
  | 'pluriel_x'
  | 'pluriel_invariable'
  | 'pluriel_aux'
  | 'pluriel_oux'
  // Féminin des adjectifs
  | 'feminin_e'
  | 'feminin_identique'
  | 'feminin_double'
  | 'feminin_irregulier'
  // Pluriel des adjectifs
  | 'adjectif_pluriel_invariable';

export interface FamilleMeta {
  key: FamilleKey;
  label: string;
  /** Un exemple vaut mieux qu'une définition : « un cheval, des chevaux ». */
  exemple: string;
  /** Ce que porte la famille : le nom, ou l'adjectif. */
  porte: 'nom' | 'adjectif';
  niveau: Niveau;
  defaultActive: boolean;
}

export const FAMILLES: FamilleMeta[] = [
  {
    key: 'pluriel_s',
    label: 'Pluriel en -s',
    exemple: 'un chat, des chats',
    porte: 'nom',
    niveau: 'ce1',
    defaultActive: true,
  },
  {
    key: 'pluriel_x',
    label: 'Pluriel en -x',
    exemple: 'un gâteau, des gâteaux',
    porte: 'nom',
    niveau: 'ce1',
    defaultActive: true,
  },
  {
    key: 'pluriel_invariable',
    label: 'Noms invariables',
    exemple: 'une souris, des souris',
    porte: 'nom',
    niveau: 'ce1',
    defaultActive: true,
  },
  {
    key: 'pluriel_aux',
    label: 'Pluriel en -aux',
    exemple: 'un cheval, des chevaux',
    porte: 'nom',
    niveau: 'ce2',
    defaultActive: false,
  },
  {
    key: 'pluriel_oux',
    label: 'Pluriel en -oux',
    exemple: 'un genou, des genoux',
    porte: 'nom',
    niveau: 'cm1',
    defaultActive: false,
  },
  {
    key: 'feminin_e',
    label: 'Féminin en -e',
    exemple: 'petit, petite',
    porte: 'adjectif',
    niveau: 'ce1',
    defaultActive: true,
  },
  {
    key: 'feminin_identique',
    label: 'Féminin identique',
    exemple: 'rouge, rouge',
    porte: 'adjectif',
    niveau: 'ce1',
    defaultActive: true,
  },
  {
    key: 'feminin_double',
    label: 'Consonne doublée',
    exemple: 'gros, grosse',
    porte: 'adjectif',
    niveau: 'ce2',
    defaultActive: false,
  },
  {
    key: 'feminin_irregulier',
    label: 'Féminin irrégulier',
    exemple: 'beau, belle',
    porte: 'adjectif',
    niveau: 'cm1',
    defaultActive: false,
  },
  {
    key: 'adjectif_pluriel_invariable',
    label: 'Adjectifs en -s, -x',
    exemple: 'gris, gris',
    porte: 'adjectif',
    niveau: 'cm1',
    defaultActive: false,
  },
];

const BY_KEY = new Map(FAMILLES.map((f) => [f.key, f]));

export const FAMILLE_KEYS: FamilleKey[] = FAMILLES.map((f) => f.key);

export const DEFAULT_ACTIVE_FAMILLES: FamilleKey[] = FAMILLES.filter(
  (f) => f.defaultActive,
).map((f) => f.key);

export function isFamilleKey(value: unknown): value is FamilleKey {
  return typeof value === 'string' && BY_KEY.has(value as FamilleKey);
}

export function getFamille(key: FamilleKey): FamilleMeta {
  const famille = BY_KEY.get(key);
  if (!famille) throw new Error(`Famille inconnue : ${key}`);
  return famille;
}

// ─── Dérivation ─────────────────────────────────────────────────────────────

/** La famille de pluriel d'un nom, lue sur ses deux formes.
 *
 * Le SINGULIER doit être testé autant que le pluriel : « gâteaux » se termine par `aux`
 * sans être un pluriel en -aux, c'est un `-eau` qui prend un x. Ne regarder que la
 * terminaison du pluriel rangeait gâteau, oiseau et château avec cheval. */
export function familleDuNom(nom: NomMeta): FamilleKey {
  if (nom.pluriel === nom.singulier) return 'pluriel_invariable';
  if (nom.singulier.endsWith('al') && nom.pluriel.endsWith('aux'))
    return 'pluriel_aux';
  if (nom.singulier.endsWith('ou') && nom.pluriel.endsWith('oux'))
    return 'pluriel_oux';
  if (nom.pluriel === `${nom.singulier}x`) return 'pluriel_x';
  return 'pluriel_s';
}

/** Les familles d'un adjectif — il en a DEUX, indépendantes : la façon dont il forme son
 * féminin, et la façon dont il forme son masculin pluriel.
 *
 * « gros / grosse / gros / grosses » double sa consonne au féminin (CE2) ET reste
 * invariable au masculin pluriel (CM1). Les traiter comme une seule famille en rangeait
 * la moitié dans la mauvaise case : gros, vieux et doux tombaient tous dans
 * « invariable » et leur féminin n'était jamais classé.
 *
 * Un adjectif n'est jouable que si TOUTES ses familles sont ouvertes : servir « les gros
 * chats » alors que le pluriel invariable n'a pas été vu l'enseignerait au passage. */
export function famillesDeLAdjectif(adj: AdjectifMeta): FamilleKey[] {
  const familles: FamilleKey[] = [];

  // Féminin. L'ordre compte : « grosse » ajoute bien un e, mais en doublant la consonne —
  // testé après le cas régulier, sinon celui-ci l'attraperait à tort.
  if (adj.fs === adj.ms) familles.push('feminin_identique');
  else if (adj.fs === `${adj.ms}e`) familles.push('feminin_e');
  else if (adj.fs === `${adj.ms}${adj.ms.slice(-1)}e`)
    familles.push('feminin_double');
  else familles.push('feminin_irregulier');

  // Masculin pluriel : invariable quand il finit déjà par s ou x.
  if (adj.mp === adj.ms) familles.push('adjectif_pluriel_invariable');

  return familles;
}
