/** Génération pure des questions d'accord : aucune dépendance à NestJS ni à la base.
 *
 * Le type d'exercice et la notion coïncident — un exercice par fiche — donc `QuestionType`
 * n'est qu'un alias de `NotionKey`. C'est plus simple que le module grammaire, où quatre
 * types se partagent dix notions.
 *
 * Un principe traverse le fichier : **l'énoncé et la réponse attendue sortent toujours de
 * la même fonction** (`groupeNominal`, `determinant`). Construire l'un à la main et l'autre
 * par une règle serait la façon la plus sûre de produire une question dont la bonne
 * réponse est refusée.
 */

import type { Difficulty } from '../../common/difficulty';
import {
  NOMS,
  VERBES,
  adjectifsCompatibles,
  commenceParVoyelle,
  determinant,
  estAnime,
  groupeNominal,
  plurielIrregulier,
  type AdjectifMeta,
  type Categorie,
  type NomMeta,
  type Nombre,
  type VerbeMeta,
} from './accords.corpus';
import {
  NOTION_KEYS,
  getNotion,
  isNotionKey,
  type NotionKey,
} from './accords.notions';

export type QuestionType = NotionKey;

export const QUESTION_TYPES: QuestionType[] = NOTION_KEYS;

export const isQuestionType = isNotionKey;

export interface AccordsQuestion {
  item_key: string;
  type: QuestionType;
  skill_key: NotionKey;
  /** La consigne. */
  display: string;
  /** Le point de départ d'une transformation : « un chat ». `null` sinon. */
  depart: string | null;
  /** Ce qui précède le trou à remplir. */
  avant: string;
  /** Ce qui suit le trou. */
  apres: string;
  /** L'indication entre parenthèses : l'adjectif ou l'infinitif à accorder. */
  indice: string | null;
  /** QCM ; vide = saisie libre. */
  choices: string[];
  answer: string;
}

export type Rand = (min: number, max: number) => number;

// ─── Difficulté ─────────────────────────────────────────────────────────────

/** La difficulté porte la MORPHOLOGIE, pas la forme de la réponse.
 *
 * `qcmChoiceCount` de `common/difficulty.ts` n'est pas utilisé : son `hard` vaut 0, au sens
 * « saisie libre ». Ici certains exercices sont déjà en saisie libre par nature (écrire un
 * pluriel), et d'autres n'ont de sens qu'en QCM — choisir entre les quatre formes d'un
 * adjectif ; les faire taper évaluerait la copie, pas l'accord. */
function nbChoix(difficulty: Difficulty): number {
  return difficulty === 'easy' ? 2 : 4;
}

/** Combien d'adjectifs dans le groupe nominal. Deux adjectifs, c'est le cas de la fiche :
 * « les chats noirs et blancs, les deux prennent le s ». */
function nbAdjectifs(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':
      return 0;
    case 'medium':
      return 1;
    case 'hard':
      return 2;
  }
}

/** En `easy`, uniquement les pluriels en -s : la règle générale, sans exception. */
function poolNoms(difficulty: Difficulty): NomMeta[] {
  return difficulty === 'easy'
    ? NOMS.filter((nomMeta) => !plurielIrregulier(nomMeta))
    : NOMS;
}

/** Les verbes dont l'accord est audible sont les plus FACILES — « est / sont » s'entend,
 * « joue / jouent » non. La fiche le dit : « il dort et ils dorment se prononcent presque
 * pareil, mais ne s'écrivent pas pareil ». La difficulté suit donc l'oreille, à l'envers
 * de l'intuition « irrégulier = difficile ». */
function poolVerbes(difficulty: Difficulty): VerbeMeta[] {
  switch (difficulty) {
    case 'easy':
      return VERBES.filter((verbeMeta) => !verbeMeta.homophone);
    case 'medium':
      return VERBES;
    case 'hard':
      return VERBES.filter((verbeMeta) => verbeMeta.homophone);
  }
}

// ─── Utilitaires de tirage ──────────────────────────────────────────────────

function shuffle<T>(items: T[], rand: Rand): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = rand(0, index);
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function pick<T>(items: T[], rand: Rand): T | null {
  if (items.length === 0) return null;
  return items[rand(0, items.length - 1)];
}

function majuscule(texte: string): string {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

/** Des adjectifs qui vont avec CE nom, au plus un par famille de sens, et de préférence
 * un devant et un derrière.
 *
 * Trois absurdités écartées d'un coup, toutes déjà produites par une version naïve :
 *   « les chapeaux sucrés »      — adjectif incompatible avec la catégorie du nom
 *   « le chapeau vert rouge »    — deux adjectifs de la même famille
 *   « le chapeau vert rapide »   — deux adjectifs derrière, qui s'empilent mal
 *
 * La forme visée est celle de la fiche : « le petit chat noir ». */
function choisirAdjectifs(
  nomMeta: NomMeta,
  combien: number,
  rand: Rand,
): AdjectifMeta[] {
  if (combien <= 0) return [];
  const compatibles = adjectifsCompatibles(nomMeta);
  if (compatibles.length === 0) return [];

  if (combien === 1) {
    const seul = pick(compatibles, rand);
    return seul ? [seul] : [];
  }

  const devant = pick(
    compatibles.filter((adj) => adj.place === 'avant'),
    rand,
  );
  const derriere = pick(
    compatibles.filter(
      (adj) => adj.place === 'apres' && adj.famille !== devant?.famille,
    ),
    rand,
  );
  return [devant, derriere].filter((adj): adj is AdjectifMeta => adj !== null);
}

/** La bonne réponse plus des distracteurs, dans l'ordre où ils sont donnés.
 *
 * `candidats` est une liste ORDONNÉE par valeur pédagogique, et les premiers sont retenus :
 * tirer au hasard dans le lot cassait la question à deux choix. « La fille ⬚ un gâteau
 * (faire) » proposait `faire / fait` — un QCM qui n'oppose plus le singulier au pluriel
 * n'interroge plus l'accord, il interroge la conjugaison. Seul l'ordre d'AFFICHAGE est
 * mélangé, pour que la bonne réponse ne soit pas toujours à la même place.
 *
 * Les formes d'un adjectif se répètent (rouge/rouge/rouges/rouges) : dédoublonner avant de
 * compter, sinon un QCM « à quatre choix » n'en affiche que deux, dont la réponse. */
function construireChoix(
  bonne: string,
  candidats: string[],
  combien: number,
  rand: Rand,
): string[] {
  const distracteurs = [...new Set(candidats)].filter(
    (choix) => choix !== bonne,
  );
  return shuffle(
    [bonne, ...distracteurs.slice(0, Math.max(1, combien - 1))],
    rand,
  );
}

// ─── genre_nom ──────────────────────────────────────────────────────────────

/** Le déterminant INDÉFINI, jamais le défini : « un / une » révèle le genre, « l’ » le
 * cache. C'est le piège que signale la fiche du déterminant, et le défini rendrait la
 * question sans réponse pour tous les noms à voyelle initiale. */
function genererGenreNom(noms: NomMeta[], rand: Rand): AccordsQuestion | null {
  const nomMeta = pick(noms, rand);
  if (!nomMeta) return null;

  return {
    item_key: `genre_nom_${nomMeta.key}`,
    type: 'genre_nom',
    skill_key: 'genre_nom',
    display: getNotion('genre_nom').consigne,
    depart: null,
    avant: '',
    // L'espace fait partie de l'énoncé : le trou est un mot, pas un préfixe collé. Les
    // segments sont rendus en `white-space: pre` côté front, cf. `accords.scss`.
    apres: ` ${nomMeta.singulier}`,
    indice: null,
    choices: shuffle(['un', 'une'], rand),
    answer: nomMeta.genre === 'masculin' ? 'un' : 'une',
  };
}

// ─── nombre_nom ─────────────────────────────────────────────────────────────

function genererNombreNom(noms: NomMeta[], rand: Rand): AccordsQuestion | null {
  const nomMeta = pick(noms, rand);
  if (!nomMeta) return null;

  const versLePluriel = rand(0, 1) === 0;
  const indefiniSingulier = nomMeta.genre === 'masculin' ? 'un' : 'une';

  return {
    item_key: `nombre_nom_${nomMeta.key}_${versLePluriel ? 'pl' : 'sg'}`,
    type: 'nombre_nom',
    skill_key: 'nombre_nom',
    display: versLePluriel
      ? 'Écris ce nom au pluriel.'
      : 'Écris ce nom au singulier.',
    depart: versLePluriel
      ? `${indefiniSingulier} ${nomMeta.singulier}`
      : `des ${nomMeta.pluriel}`,
    avant: versLePluriel ? 'des ' : `${indefiniSingulier} `,
    apres: '',
    indice: null,
    choices: [],
    answer: versLePluriel ? nomMeta.pluriel : nomMeta.singulier,
  };
}

// ─── accord_adjectif ────────────────────────────────────────────────────────

function formeAdjectif(
  adj: AdjectifMeta,
  nomMeta: NomMeta,
  nombre: Nombre,
): string {
  if (nomMeta.genre === 'masculin') {
    return nombre === 'singulier' ? adj.ms : adj.mp;
  }
  return nombre === 'singulier' ? adj.fs : adj.fp;
}

/** Les trois autres formes de l'adjectif, la plus instructive d'abord. */
function distracteursAdjectif(
  adj: AdjectifMeta,
  nomMeta: NomMeta,
  nombre: Nombre,
): string[] {
  const autreNombre: Nombre = nombre === 'singulier' ? 'pluriel' : 'singulier';
  const autreGenre: NomMeta = {
    ...nomMeta,
    genre: nomMeta.genre === 'masculin' ? 'feminin' : 'masculin',
  };
  return [
    formeAdjectif(adj, nomMeta, autreNombre),
    formeAdjectif(adj, autreGenre, nombre),
    formeAdjectif(adj, autreGenre, autreNombre),
  ];
}

function genererAccordAdjectif(
  noms: NomMeta[],
  nbChoixVoulu: number,
  rand: Rand,
): AccordsQuestion | null {
  const nomMeta = pick(noms, rand);
  if (!nomMeta) return null;
  const adj = pick(adjectifsCompatibles(nomMeta), rand);
  if (!adj) return null;

  const nombre: Nombre = rand(0, 1) === 0 ? 'singulier' : 'pluriel';
  const bonne = formeAdjectif(adj, nomMeta, nombre);
  const noyau = nomMeta[nombre];

  // L'élision porte sur le premier mot du groupe, pas sur le nom : « la petite école »
  // mais « l’école propre ». Le trou étant à la place de l'adjectif, le premier mot
  // dépend de sa place.
  const premier = adj.place === 'avant' ? bonne : noyau;
  const det = determinant(
    nomMeta.genre,
    nombre,
    'defini',
    commenceParVoyelle(premier),
  );
  const collage = det.endsWith('’') ? '' : ' ';

  return {
    item_key: `accord_adjectif_${nomMeta.key}_${adj.key}_${nombre}`,
    type: 'accord_adjectif',
    skill_key: 'accord_adjectif',
    display: getNotion('accord_adjectif').consigne,
    depart: null,
    avant:
      adj.place === 'avant' ? `${det}${collage}` : `${det}${collage}${noyau} `,
    apres: adj.place === 'avant' ? ` ${noyau}` : '',
    indice: adj.ms,
    // Distracteurs par valeur décroissante : d'abord la forme qui ne diffère que par le
    // NOMBRE (même genre) — c'est la marque qu'on travaille — puis celle qui ne diffère
    // que par le genre, puis la dernière.
    choices: construireChoix(
      bonne,
      distracteursAdjectif(adj, nomMeta, nombre),
      nbChoixVoulu,
      rand,
    ),
    answer: bonne,
  };
}

// ─── accord_gn ──────────────────────────────────────────────────────────────

function genererAccordGn(
  noms: NomMeta[],
  combienAdjectifs: number,
  rand: Rand,
): AccordsQuestion | null {
  const nomMeta = pick(noms, rand);
  if (!nomMeta) return null;

  const adjectifs = choisirAdjectifs(nomMeta, combienAdjectifs, rand);
  const versLePluriel = rand(0, 1) === 0;
  const source: Nombre = versLePluriel ? 'singulier' : 'pluriel';
  const cible: Nombre = versLePluriel ? 'pluriel' : 'singulier';

  return {
    item_key: `accord_gn_${nomMeta.key}_${adjectifs.map((adj) => adj.key).join('-')}_${cible}`,
    type: 'accord_gn',
    skill_key: 'accord_gn',
    display: versLePluriel
      ? 'Écris tout le groupe nominal au pluriel.'
      : 'Écris tout le groupe nominal au singulier.',
    depart: groupeNominal(nomMeta, adjectifs, source),
    avant: '',
    apres: '',
    indice: null,
    choices: [],
    answer: groupeNominal(nomMeta, adjectifs, cible),
  };
}

// ─── accord_sujet_verbe ─────────────────────────────────────────────────────

/** Le sujet coordonné de la fiche : « Maëve et Léa chantent ». Deux personnes donc
 * pluriel, alors qu'aucun mot ne porte de s. C'est le cas qui montre que l'accord suit le
 * sens du sujet, pas la présence d'une marque. */
const SUJETS_COORDONNES: { texte: string; categorie: Categorie }[] = [
  { texte: 'Maëve et Léa', categorie: 'personne' },
  { texte: 'Papa et Maëve', categorie: 'personne' },
  { texte: 'Le chat et le chien', categorie: 'animal' },
];

function genererAccordSujetVerbe(
  noms: NomMeta[],
  verbes: VerbeMeta[],
  nbChoixVoulu: number,
  rand: Rand,
): AccordsQuestion | null {
  const verbeMeta = pick(verbes, rand);
  if (!verbeMeta) return null;

  const coordonne = rand(0, 5) === 0;
  let sujet: string;
  let nombre: Nombre;
  let cle: string;

  if (coordonne) {
    const choisi = pick(
      SUJETS_COORDONNES.filter((candidat) =>
        verbeMeta.sujets.includes(candidat.categorie),
      ),
      rand,
    );
    if (!choisi) return null;
    sujet = choisi.texte;
    nombre = 'pluriel';
    cle = choisi.texte.replace(/\s+/g, '-');
  } else {
    // Sujet animé ET compatible avec CE verbe : « la table dort sur le tapis » et « les
    // chiens dessinent un soleil » sont tous deux corrects et absurdes, et l'absurdité
    // déplace l'attention de l'accord vers la phrase.
    const nomMeta = pick(
      noms.filter(
        (candidat) =>
          estAnime(candidat) && verbeMeta.sujets.includes(candidat.categorie),
      ),
      rand,
    );
    if (!nomMeta) return null;
    nombre = rand(0, 1) === 0 ? 'singulier' : 'pluriel';
    sujet = majuscule(groupeNominal(nomMeta, [], nombre));
    cle = `${nomMeta.key}-${nombre}`;
  }

  const bonne = nombre === 'singulier' ? verbeMeta.s3 : verbeMeta.p3;

  return {
    item_key: `accord_sujet_verbe_${cle}_${verbeMeta.key}`,
    type: 'accord_sujet_verbe',
    skill_key: 'accord_sujet_verbe',
    display: getNotion('accord_sujet_verbe').consigne,
    depart: null,
    avant: `${sujet} `,
    apres: ` ${verbeMeta.suite}`,
    indice: verbeMeta.infinitif,
    // La forme opposée EN PREMIER : c'est elle qui fait la question. L'infinitif n'est un
    // distracteur acceptable qu'en troisième position, quand il y a de la place.
    choices: construireChoix(
      bonne,
      [
        nombre === 'singulier' ? verbeMeta.p3 : verbeMeta.s3,
        verbeMeta.infinitif,
      ],
      nbChoixVoulu,
      rand,
    ),
    answer: bonne,
  };
}

// ─── Composition d'une séance ───────────────────────────────────────────────

export function generateQuestion(
  type: QuestionType,
  difficulty: Difficulty,
  notionsActives: NotionKey[],
  rand: Rand,
): AccordsQuestion | null {
  if (!notionsActives.includes(type)) return null;

  const noms = poolNoms(difficulty);

  switch (type) {
    case 'genre_nom':
      return genererGenreNom(noms, rand);
    case 'nombre_nom':
      return genererNombreNom(noms, rand);
    case 'accord_adjectif':
      return genererAccordAdjectif(noms, nbChoix(difficulty), rand);
    case 'accord_gn':
      return genererAccordGn(noms, nbAdjectifs(difficulty), rand);
    case 'accord_sujet_verbe':
      return genererAccordSujetVerbe(
        noms,
        poolVerbes(difficulty),
        nbChoix(difficulty),
        rand,
      );
  }
}

export function generateQuestions(
  count: number,
  types: QuestionType[],
  difficulty: Difficulty,
  notionsActives: NotionKey[],
  rand: Rand,
): AccordsQuestion[] {
  const questions: AccordsQuestion[] = [];
  const used = new Set<string>();
  let attempts = 0;

  while (
    questions.length < count &&
    attempts < count * 15 &&
    types.length > 0
  ) {
    attempts++;
    const type = pick(types, rand);
    if (!type) break;
    const question = generateQuestion(type, difficulty, notionsActives, rand);
    if (!question || used.has(question.item_key)) continue;
    used.add(question.item_key);
    questions.push(question);
  }

  return questions;
}

// ─── Validation d'une saisie ────────────────────────────────────────────────

/** Ce module n'enlève PAS les accents, contrairement à `geometrie.game.tsx` qui accepte
 * « decagone ». Là-bas le module évalue la géométrie et l'orthographe est hors sujet ; ici
 * l'orthographe EST la réponse — « des gateaux » sans circonflexe est une faute, et la
 * passer enseignerait l'inverse de la leçon.
 *
 * Ce qui est toléré en revanche, parce que sans rapport avec l'accord :
 *   — la casse, l'énoncé s'affichant en minuscules ;
 *   — les espaces en trop, y compris au milieu ;
 *   — la forme de l'apostrophe : un clavier donne `'`, l'énoncé affiche `’`. */
export function normaliseReponse(saisie: string): string {
  return saisie
    .trim()
    .toLowerCase()
    .replace(/[’‘`]/g, "'")
    .replace(/\s+/g, ' ');
}

export function reponseCorrecte(attendue: string, saisie: string): boolean {
  return normaliseReponse(attendue) === normaliseReponse(saisie);
}
