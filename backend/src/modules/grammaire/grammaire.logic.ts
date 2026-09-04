/** Génération pure des questions de grammaire : aucune dépendance à NestJS ni à la base.
 * `grammaire.service.ts` n'y ajoute que les réglages (notions actives, difficulté, nombre
 * de questions) et la persistance.
 *
 * `rand(min, max)` est injecté plutôt qu'appelé en dur, comme dans `geometrie.logic.ts` :
 * les tests passent un tirage déterministe.
 *
 * Un principe traverse tout le fichier : **on ne demande jamais la nature d'un mot hors
 * phrase**. « Quelle est la nature de ferme ? » n'a pas de réponse — nom dans « la ferme
 * du voisin », verbe dans « le fermier ferme la porte ». La phrase n'est pas un décor,
 * c'est ce qui rend la question décidable. Et c'est aussi ce que dit la fiche du cours :
 * un enfant de CE1 classe les mots par ce qu'ils font dans la phrase.
 */

import type { Difficulty } from '../../common/difficulty';
import {
  CORPUS,
  NIVEAUX,
  type MotAnnote,
  type Niveau,
  type PhraseAnnotee,
} from './grammaire.corpus';
import {
  consigne,
  getNotion,
  isNature,
  type Fonction,
  type Nature,
  type NotionKey,
} from './grammaire.notions';

export type QuestionType =
  | 'nature_mot'
  | 'trouver_mots'
  | 'trouver_fonction'
  | 'groupe_nominal';

export const QUESTION_TYPES: QuestionType[] = [
  'nature_mot',
  'trouver_mots',
  'trouver_fonction',
  'groupe_nominal',
];

export function isQuestionType(value: unknown): value is QuestionType {
  return (
    typeof value === 'string' &&
    (QUESTION_TYPES as readonly string[]).includes(value)
  );
}

/** Le mot tel qu'envoyé au front : la nature et la fonction restent au serveur.
 * Ce qui doit être trouvé ne voyage pas mot par mot dans la charge utile. */
export interface MotAffiche {
  mot: string;
  apres: string;
  colle: boolean;
}

export interface GrammaireQuestion {
  item_key: string;
  type: QuestionType;
  /** La notion travaillée : c'est à ce grain que se joue la maîtrise. */
  skill_key: NotionKey;
  display: string;
  mots: MotAffiche[];
  /** Index du mot souligné — `nature_mot` seulement. */
  cible: number | null;
  /** Choix du QCM — `nature_mot` seulement. */
  choices: string[];
  /** La bonne réponse, telle qu'affichée en correction. */
  answer: string;
  /** Index des mots à toucher — types de sélection seulement. */
  answer_indices: number[];
}

export type Rand = (min: number, max: number) => number;

// ─── Difficulté ─────────────────────────────────────────────────────────────

/** La difficulté porte la complexité de la PHRASE, pas la forme de la réponse.
 *
 * `qcmChoiceCount` de `common/difficulty.ts` n'est volontairement pas utilisé ici : son
 * `hard` vaut 0, c'est-à-dire saisie libre, et faire taper « déterminant » évalue
 * l'orthographe d'un mot de douze lettres, pas la grammaire. En grammaire, `hard` veut
 * dire une phrase plus dure et tous les choix ouverts. */
export function niveauxPour(difficulty: Difficulty): Niveau[] {
  switch (difficulty) {
    case 'easy':
      return ['simple'];
    case 'medium':
      return ['simple', 'moyen'];
    case 'hard':
      return NIVEAUX;
  }
}

/** Nombre de propositions du QCM de nature. `0` = toutes les natures actives. */
export function nombreDeChoix(difficulty: Difficulty): number {
  switch (difficulty) {
    case 'easy':
      return 2;
    case 'medium':
      return 4;
    case 'hard':
      return 0;
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

// ─── Lecture d'une phrase annotée ───────────────────────────────────────────

function affichage(phrase: PhraseAnnotee): MotAffiche[] {
  return phrase.mots.map((mot) => ({
    mot: mot.mot,
    apres: mot.apres,
    colle: mot.colle,
  }));
}

function indicesParNature(phrase: PhraseAnnotee, nature: Nature): number[] {
  return phrase.mots.flatMap((mot, index) =>
    mot.nature === nature ? [index] : [],
  );
}

function indicesParFonction(
  phrase: PhraseAnnotee,
  fonction: Fonction,
): number[] {
  return phrase.mots.flatMap((mot, index) =>
    mot.fonction === fonction ? [index] : [],
  );
}

/** Nombre de suites consécutives de mots portant cette fonction.
 *
 * Deux compléments dans la même phrase — « Derrière la maison, un vieux chien dort
 * tranquillement » — donneraient une consigne au pluriel qui demande de toucher deux
 * groupes séparés d'un coup. On préfère écarter ces phrases de la question de fonction
 * plutôt que de tordre la consigne ; elles restent utiles pour tout le reste. */
function nombreDeGroupes(phrase: PhraseAnnotee, fonction: Fonction): number {
  let groupes = 0;
  let dedans = false;
  for (const mot of phrase.mots) {
    if (mot.fonction === fonction) {
      if (!dedans) groupes++;
      dedans = true;
    } else {
      dedans = false;
    }
  }
  return groupes;
}

function indicesDuGroupeNominal(phrase: PhraseAnnotee, gn: number): number[] {
  return phrase.mots.flatMap((mot, index) => (mot.gn === gn ? [index] : []));
}

function groupesNominaux(phrase: PhraseAnnotee): number[] {
  const vus = new Set<number>();
  for (const mot of phrase.mots) {
    if (mot.gn !== null) vus.add(mot.gn);
  }
  return [...vus].sort((a, b) => a - b);
}

/** Le nom qui porte le groupe : c'est par lui qu'on désigne le groupe dans la consigne,
 * parce que c'est ainsi qu'on l'apprend — on trouve le nom, puis ce qui va avec. */
function nomDuGroupe(phrase: PhraseAnnotee, gn: number): MotAnnote | null {
  return (
    phrase.mots.find(
      (mot) =>
        mot.gn === gn &&
        (mot.nature === 'nom_commun' || mot.nature === 'nom_propre'),
    ) ?? null
  );
}

/** Les mots visés, recollés — « le petit chat », « sur le tapis ». */
function extrait(phrase: PhraseAnnotee, indices: number[]): string {
  return indices
    .map((index, rang) => {
      const mot = phrase.mots[index];
      const separateur = rang === 0 || mot.colle ? '' : ' ';
      return `${separateur}${mot.mot}`;
    })
    .join('');
}

// ─── nature_mot ─────────────────────────────────────────────────────────────

function genererNatureMot(
  phrases: PhraseAnnotee[],
  naturesActives: Nature[],
  nbChoix: number,
  rand: Rand,
): GrammaireQuestion | null {
  // Un QCM a besoin d'au moins deux propositions, sinon la réponse est offerte. Et le
  // cas est plus profond que cosmétique : demander de quelle nature est un mot quand
  // l'enfant n'en connaît qu'une seule ne teste rien. On laisse alors les questions de
  // sélection faire le travail — « touche le verbe » reste une vraie question.
  if (naturesActives.length < 2) return null;

  const candidates = phrases.filter((phrase) =>
    phrase.mots.some((mot) => naturesActives.includes(mot.nature)),
  );
  const phrase = pick(candidates, rand);
  if (!phrase) return null;

  const indices = phrase.mots.flatMap((mot, index) =>
    naturesActives.includes(mot.nature) ? [index] : [],
  );
  const cible = pick(indices, rand);
  if (cible === null) return null;

  const nature = phrase.mots[cible].nature;
  const bonne = getNotion(nature).label;
  const distracteurs = naturesActives
    .filter((autre) => autre !== nature)
    .map((autre) => getNotion(autre).label);

  const choices =
    nbChoix <= 0
      ? shuffle([bonne, ...distracteurs], rand)
      : shuffle(
          [bonne, ...shuffle(distracteurs, rand).slice(0, nbChoix - 1)],
          rand,
        );

  return {
    item_key: `nature_mot_${phrase.key}_${cible}`,
    type: 'nature_mot',
    skill_key: nature,
    display: 'Quelle est la nature du mot souligné ?',
    mots: affichage(phrase),
    cible,
    choices,
    answer: bonne,
    answer_indices: [cible],
  };
}

// ─── trouver_mots ───────────────────────────────────────────────────────────

function genererTrouverMots(
  phrases: PhraseAnnotee[],
  naturesActives: Nature[],
  rand: Rand,
): GrammaireQuestion | null {
  const nature = pick(naturesActives, rand);
  if (!nature) return null;

  const candidates = phrases.filter(
    (phrase) => indicesParNature(phrase, nature).length > 0,
  );
  const phrase = pick(candidates, rand);
  if (!phrase) return null;

  const indices = indicesParNature(phrase, nature);

  return {
    item_key: `trouver_mots_${phrase.key}_${nature}`,
    type: 'trouver_mots',
    skill_key: nature,
    display: consigne(nature, indices.length),
    mots: affichage(phrase),
    cible: null,
    choices: [],
    answer: extrait(phrase, indices),
    answer_indices: indices,
  };
}

// ─── trouver_fonction ───────────────────────────────────────────────────────

function genererTrouverFonction(
  phrases: PhraseAnnotee[],
  fonctionsActives: Fonction[],
  rand: Rand,
): GrammaireQuestion | null {
  const fonction = pick(fonctionsActives, rand);
  if (!fonction) return null;

  const candidates = phrases.filter(
    (phrase) => nombreDeGroupes(phrase, fonction) === 1,
  );
  const phrase = pick(candidates, rand);
  if (!phrase) return null;

  const indices = indicesParFonction(phrase, fonction);

  return {
    item_key: `trouver_fonction_${phrase.key}_${fonction}`,
    type: 'trouver_fonction',
    skill_key: fonction,
    display: consigne(fonction, 1),
    mots: affichage(phrase),
    cible: null,
    choices: [],
    answer: extrait(phrase, indices),
    answer_indices: indices,
  };
}

// ─── groupe_nominal ─────────────────────────────────────────────────────────

function genererGroupeNominal(
  phrases: PhraseAnnotee[],
  rand: Rand,
): GrammaireQuestion | null {
  const candidates = phrases.filter((phrase) =>
    groupesNominaux(phrase).some((gn) => nomDuGroupe(phrase, gn) !== null),
  );
  const phrase = pick(candidates, rand);
  if (!phrase) return null;

  const groupes = groupesNominaux(phrase).filter(
    (gn) => nomDuGroupe(phrase, gn) !== null,
  );
  const gn = pick(groupes, rand);
  if (gn === null) return null;

  const indices = indicesDuGroupeNominal(phrase, gn);
  const nom = nomDuGroupe(phrase, gn)!;

  return {
    item_key: `groupe_nominal_${phrase.key}_${gn}`,
    type: 'groupe_nominal',
    skill_key: 'groupe_nominal',
    display: `Touche le groupe nominal du nom « ${nom.mot} ».`,
    mots: affichage(phrase),
    cible: null,
    choices: [],
    answer: extrait(phrase, indices),
    answer_indices: indices,
  };
}

// ─── Composition d'une séance ───────────────────────────────────────────────

export function generateQuestion(
  type: QuestionType,
  phrases: PhraseAnnotee[],
  notionsActives: NotionKey[],
  nbChoix: number,
  rand: Rand,
): GrammaireQuestion | null {
  const naturesActives = notionsActives.filter(isNature);
  const fonctionsActives = notionsActives.filter(
    (notion): notion is Fonction =>
      notion === 'sujet' || notion === 'complement',
  );

  switch (type) {
    case 'nature_mot':
      return genererNatureMot(phrases, naturesActives, nbChoix, rand);
    case 'trouver_mots':
      return genererTrouverMots(phrases, naturesActives, rand);
    case 'trouver_fonction':
      return genererTrouverFonction(phrases, fonctionsActives, rand);
    case 'groupe_nominal':
      return notionsActives.includes('groupe_nominal')
        ? genererGroupeNominal(phrases, rand)
        : null;
  }
}

export function generateQuestions(
  count: number,
  types: QuestionType[],
  difficulty: Difficulty,
  notionsActives: NotionKey[],
  rand: Rand,
  corpus: PhraseAnnotee[] = CORPUS,
): GrammaireQuestion[] {
  const niveaux = niveauxPour(difficulty);
  const phrases = corpus.filter((phrase) => niveaux.includes(phrase.niveau));
  const nbChoix = nombreDeChoix(difficulty);

  const questions: GrammaireQuestion[] = [];
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
    const question = generateQuestion(
      type,
      phrases,
      notionsActives,
      nbChoix,
      rand,
    );
    if (!question || used.has(question.item_key)) continue;
    used.add(question.item_key);
    questions.push(question);
  }

  return questions;
}

/** Les notions qu'il faudrait activer pour que ces types de question produisent quelque
 * chose. Sert à écrire un message d'erreur qui dit quoi faire, plutôt que « aucune
 * question disponible ». */
export function notionsRequises(types: QuestionType[]): NotionKey[] {
  const requises = new Set<NotionKey>();
  for (const type of types) {
    switch (type) {
      case 'nature_mot':
      case 'trouver_mots':
        requises.add('nom_commun');
        requises.add('verbe');
        break;
      case 'trouver_fonction':
        requises.add('sujet');
        requises.add('complement');
        break;
      case 'groupe_nominal':
        requises.add('groupe_nominal');
        break;
    }
  }
  return [...requises];
}
