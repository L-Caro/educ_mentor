/** Les temps dérivés, et le niveau auquel chaque temps s'introduit.
 *
 * Le fichier de données ne porte que trois temps saisis à la main — présent, imparfait,
 * futur — plus, par verbe, un participe passé, un auxiliaire et le radical du passé
 * simple. Les quatre autres temps sont CALCULÉS ici.
 *
 * C'est délibéré, et c'est la même règle que `groupeNominal()` dans le module accords :
 * saisir quatre temps pour cinquante verbes et neuf pronoms ferait 1 800 formes écrites à
 * la main, dans le fichier où une faute enseigne une conjugaison fausse. Trois champs par
 * verbe, dérivés par des fonctions testées, en font 150 — et chacune est vérifiable.
 *
 * Ce qui rend la dérivation possible :
 *   — le conditionnel présent est le RADICAL DU FUTUR plus les terminaisons de
 *     l'imparfait. Le radical se lit sur la forme « je » du futur, en retirant son `ai` :
 *     `irai → ir`, `pourrai → pourr`, `serai → ser`. Vrai pour les irréguliers aussi,
 *     c'est ce qui rend la règle sûre.
 *   — les temps composés sont l'auxiliaire conjugué plus le participe passé, et les
 *     auxiliaires sont déjà dans le fichier avec leurs propres temps simples.
 *   — le passé simple est un radical plus l'une des quatre familles de terminaisons.
 */

import type { Niveau } from '../../common/niveau';

export type Pronom =
  | 'je'
  | 'tu'
  | 'il'
  | 'elle'
  | 'on'
  | 'nous'
  | 'vous'
  | 'ils'
  | 'elles';

export const PRONOMS: Pronom[] = [
  'je',
  'tu',
  'il',
  'elle',
  'on',
  'nous',
  'vous',
  'ils',
  'elles',
];

export type Formes = Record<Pronom, string>;

export type FamillePasseSimple = 'a' | 'i' | 'u' | 'in';

export interface VerbData {
  groupe: string;
  conjugaisons: Record<string, Formes>;
  participe: string;
  auxiliaire: 'avoir' | 'être';
  passeSimple: { radical: string; famille: FamillePasseSimple };
}

// ─── Les temps, et le niveau où ils s'introduisent ──────────────────────────

export type Tense =
  | 'présent'
  | 'imparfait'
  | 'futur'
  | 'passé composé'
  | 'plus-que-parfait'
  | 'passé simple'
  | 'conditionnel présent';

export interface TenseMeta {
  key: Tense;
  /** Le libellé affiché à l'enfant. */
  label: string;
  /** Un exemple, parce qu'« imparfait » ne dit rien et « je mangeais » tout. */
  exemple: string;
  /** La classe où le temps s'introduit. ÉTIQUETTE, pas porte : elle sert à décider quoi
   * ouvrir depuis l'administration, elle n'ouvre rien elle-même. */
  niveau: Niveau;
  /** Actif à l'installation. Les temps des classes supérieures sont présents mais
   * FERMÉS — on les ouvre quand la classe les a vus. */
  defaultActive: boolean;
  /** Saisi dans le fichier de données, ou calculé ici. */
  source: 'donnee' | 'derive';
}

/** Dans l'ordre du programme, pas dans l'ordre alphabétique. */
export const TENSES: TenseMeta[] = [
  {
    key: 'présent',
    label: 'Présent',
    exemple: 'je mange',
    niveau: 'cp',
    defaultActive: true,
    source: 'donnee',
  },
  {
    key: 'imparfait',
    label: 'Imparfait',
    exemple: 'je mangeais',
    niveau: 'ce1',
    defaultActive: true,
    source: 'donnee',
  },
  {
    key: 'futur',
    label: 'Futur simple',
    exemple: 'je mangerai',
    niveau: 'ce1',
    defaultActive: true,
    source: 'donnee',
  },
  {
    key: 'passé composé',
    label: 'Passé composé',
    exemple: "j'ai mangé",
    niveau: 'ce2',
    defaultActive: false,
    source: 'derive',
  },
  {
    key: 'plus-que-parfait',
    label: 'Plus-que-parfait',
    exemple: "j'avais mangé",
    niveau: 'cm1',
    defaultActive: false,
    source: 'derive',
  },
  {
    key: 'passé simple',
    label: 'Passé simple',
    exemple: 'je mangeai',
    niveau: 'cm1',
    defaultActive: false,
    source: 'derive',
  },
  {
    key: 'conditionnel présent',
    label: 'Conditionnel présent',
    exemple: 'je mangerais',
    niveau: 'cm2',
    defaultActive: false,
    source: 'derive',
  },
];

/** Les temps actifs à l'installation, dans le même esprit que `DEFAULT_ACTIVE_SHAPES`
 * pour la géométrie : ce qu'un début de CE1 peut jouer. Tout le reste est là, fermé. */
export const DEFAULT_ACTIVE_TENSES: Tense[] = TENSES.filter(
  (temps) => temps.defaultActive,
).map((temps) => temps.key);

const TENSE_BY_KEY = new Map(TENSES.map((t) => [t.key, t]));

export const TENSE_KEYS: Tense[] = TENSES.map((t) => t.key);

export function isTense(value: unknown): value is Tense {
  return typeof value === 'string' && TENSE_BY_KEY.has(value as Tense);
}

export function getTense(key: Tense): TenseMeta {
  const meta = TENSE_BY_KEY.get(key);
  if (!meta) throw new Error(`Temps inconnu : ${key}`);
  return meta;
}

// ─── Conditionnel présent ───────────────────────────────────────────────────

const TERMINAISONS_CONDITIONNEL: Formes = {
  je: 'ais',
  tu: 'ais',
  il: 'ait',
  elle: 'ait',
  on: 'ait',
  nous: 'ions',
  vous: 'iez',
  ils: 'aient',
  elles: 'aient',
};

/** Le radical du futur, lu sur la forme « je » : `chanterai → chanter`, `irai → ir`.
 * Toutes les formes de futur en français se terminent par `ai` à la première personne —
 * c'est ce qui rend la règle sûre y compris pour les verbes irréguliers. */
export function radicalDuFutur(futurJe: string): string {
  if (!futurJe.endsWith('ai')) {
    throw new Error(
      `Forme de futur inattendue : « ${futurJe} » ne se termine pas par « ai »`,
    );
  }
  return futurJe.slice(0, -2);
}

export function conditionnelPresent(futur: Formes): Formes {
  const radical = radicalDuFutur(futur.je);
  return mapPronoms(
    (pronom) => `${radical}${TERMINAISONS_CONDITIONNEL[pronom]}`,
  );
}

// ─── Passé simple ───────────────────────────────────────────────────────────

const TERMINAISONS_PASSE_SIMPLE: Record<FamillePasseSimple, Formes> = {
  a: {
    je: 'ai',
    tu: 'as',
    il: 'a',
    elle: 'a',
    on: 'a',
    nous: 'âmes',
    vous: 'âtes',
    ils: 'èrent',
    elles: 'èrent',
  },
  i: {
    je: 'is',
    tu: 'is',
    il: 'it',
    elle: 'it',
    on: 'it',
    nous: 'îmes',
    vous: 'îtes',
    ils: 'irent',
    elles: 'irent',
  },
  u: {
    je: 'us',
    tu: 'us',
    il: 'ut',
    elle: 'ut',
    on: 'ut',
    nous: 'ûmes',
    vous: 'ûtes',
    ils: 'urent',
    elles: 'urent',
  },
  in: {
    je: 'ins',
    tu: 'ins',
    il: 'int',
    elle: 'int',
    on: 'int',
    nous: 'înmes',
    vous: 'întes',
    ils: 'inrent',
    elles: 'inrent',
  },
};

export function passeSimple(
  radical: string,
  famille: FamillePasseSimple,
): Formes {
  const terminaisons = TERMINAISONS_PASSE_SIMPLE[famille];
  return mapPronoms((pronom) => `${radical}${terminaisons[pronom]}`);
}

// ─── Temps composés ─────────────────────────────────────────────────────────

/** L'accord du participe passé employé avec ÊTRE : il s'accorde avec le sujet.
 *
 * `je`, `tu` et `on` prennent le masculin, faute de genre connu — c'est la convention des
 * tableaux de conjugaison, et c'est ce que l'enfant verra dans son cahier. */
function accorder(participe: string, pronom: Pronom): string {
  switch (pronom) {
    case 'elle':
      return `${participe}e`;
    case 'elles':
      return `${participe}es`;
    case 'nous':
    case 'vous':
    case 'ils':
      return `${participe}s`;
    default:
      return participe;
  }
}

/** Auxiliaire conjugué + participe passé. `auxiliaireConjugue` est l'auxiliaire au temps
 * simple correspondant : présent pour le passé composé, imparfait pour le plus-que-parfait. */
export function tempsCompose(
  auxiliaireConjugue: Formes,
  participe: string,
  auxiliaire: 'avoir' | 'être',
): Formes {
  return mapPronoms((pronom) => {
    const forme =
      auxiliaire === 'être' ? accorder(participe, pronom) : participe;
    return `${auxiliaireConjugue[pronom]} ${forme}`;
  });
}

// ─── Composition ────────────────────────────────────────────────────────────

function mapPronoms(f: (pronom: Pronom) => string): Formes {
  return Object.fromEntries(
    PRONOMS.map((pronom) => [pronom, f(pronom)]),
  ) as Formes;
}

/** Toutes les conjugaisons d'un verbe : les trois temps du fichier, plus les quatre
 * dérivés. Appelée une fois au chargement du service, jamais par question. */
export function conjugaisonsCompletes(
  verbe: VerbData,
  auxiliaires: Record<'avoir' | 'être', VerbData>,
): Record<Tense, Formes> {
  const aux = auxiliaires[verbe.auxiliaire];
  const simples = verbe.conjugaisons;

  return {
    présent: simples['présent'],
    imparfait: simples['imparfait'],
    futur: simples['futur'],
    'passé composé': tempsCompose(
      aux.conjugaisons['présent'],
      verbe.participe,
      verbe.auxiliaire,
    ),
    'plus-que-parfait': tempsCompose(
      aux.conjugaisons['imparfait'],
      verbe.participe,
      verbe.auxiliaire,
    ),
    'passé simple': passeSimple(
      verbe.passeSimple.radical,
      verbe.passeSimple.famille,
    ),
    'conditionnel présent': conditionnelPresent(simples['futur']),
  };
}
