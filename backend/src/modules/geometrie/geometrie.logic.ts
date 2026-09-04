/** Génération pure des questions de géométrie : aucune dépendance à NestJS ni à la base,
 * pour être testable sans monter le module. `geometrie.service.ts` n'y ajoute que les
 * réglages (figures actives, difficulté, nombre de questions) et la persistance.
 *
 * `rand(min, max)` est injecté plutôt qu'appelé en dur : les tests passent un tirage
 * déterministe, exactement comme `pose.generator.ts` le fait pour les opérations posées. */

import type { ShapeMeta } from './geometrie.shapes';

export type QuestionType =
  | 'nom_figure'
  | 'nom_solide'
  | 'cotes_sommets'
  | 'angle_droit'
  | 'proprietes';

export const QUESTION_TYPES: QuestionType[] = [
  'nom_figure',
  'nom_solide',
  'cotes_sommets',
  'angle_droit',
  'proprietes',
];

export function isQuestionType(value: unknown): value is QuestionType {
  return (
    typeof value === 'string' &&
    (QUESTION_TYPES as readonly string[]).includes(value)
  );
}

export interface GeometrieQuestion {
  item_key: string;
  type: QuestionType;
  /** Ce qui est suivi dans la progression : la forme seule, ou la paire pour `proprietes`. */
  skill_key: string;
  display: string;
  /** Forme principale à dessiner. */
  shape: string;
  /** Seconde forme, uniquement pour `proprietes` (les deux sont dessinées, côte à côte). */
  shapeB: string | null;
  choices: string[];
  answer: string;
}

export type Rand = (min: number, max: number) => number;

function shuffle<T>(items: T[], rand: Rand): T[] {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index--) {
    const swap = rand(0, index);
    [copy[index], copy[swap]] = [copy[swap], copy[index]];
  }
  return copy;
}

function pick<T>(items: T[], rand: Rand): T {
  return items[rand(0, items.length - 1)];
}

/** Construit un QCM : la bonne réponse + jusqu'à `choicesCount - 1` distracteurs pris dans
 * le pool. `choicesCount <= 0` = saisie libre, pas de choix construits. */
function buildChoices(
  answer: string,
  distractorPool: string[],
  choicesCount: number,
  rand: Rand,
): string[] {
  if (choicesCount <= 0) return [];
  const distractors = shuffle(distractorPool, rand).slice(0, choicesCount - 1);
  return shuffle([answer, ...distractors], rand);
}

// ─── nom_figure / nom_solide ────────────────────────────────────────────────

function generateNom(
  type: 'nom_figure' | 'nom_solide',
  pool: ShapeMeta[],
  choicesCount: number,
  rand: Rand,
): GeometrieQuestion | null {
  if (pool.length === 0) return null;
  const shape = pick(pool, rand);
  const distractors = pool
    .filter((candidate) => candidate.key !== shape.key)
    .map((candidate) => candidate.nom);

  return {
    item_key: `${type}_${shape.key}`,
    type,
    skill_key: shape.key,
    display:
      type === 'nom_figure'
        ? "Comment s'appelle cette figure ?"
        : "Comment s'appelle ce solide ?",
    shape: shape.key,
    shapeB: null,
    choices: buildChoices(shape.nom, distractors, choicesCount, rand),
    answer: shape.nom,
  };
}

// ─── cotes_sommets ──────────────────────────────────────────────────────────

const PLANE_ATTRIBUTES = ['cotes', 'sommets'] as const;
const SOLIDE_ATTRIBUTES = ['faces', 'sommets', 'aretes'] as const;

const ATTRIBUTE_LABEL: Record<string, string> = {
  cotes: 'de côtés',
  sommets: 'de sommets',
  faces: 'de faces',
  aretes: "d'arêtes",
};

function nearbyNumbers(count: number, size: number, rand: Rand): number[] {
  const candidates = [count - 2, count - 1, count + 1, count + 2].filter(
    (n) => n >= 0,
  );
  return shuffle(candidates, rand).slice(0, size);
}

function generateCotesSommets(
  pool: ShapeMeta[],
  choicesCount: number,
  rand: Rand,
): GeometrieQuestion | null {
  if (pool.length === 0) return null;
  const shape = pick(pool, rand);
  const attributes =
    shape.type === 'plane' ? PLANE_ATTRIBUTES : SOLIDE_ATTRIBUTES;
  const attribute = pick([...attributes], rand);
  const count = shape[attribute as keyof ShapeMeta] as number;

  const sujet = shape.type === 'plane' ? 'cette figure' : 'ce solide';
  const verbe = shape.type === 'plane' ? 'a-t-elle' : 'a-t-il';

  return {
    item_key: `cotes_sommets_${shape.key}_${attribute}`,
    type: 'cotes_sommets',
    skill_key: shape.key,
    display: ['Combien', sujet, verbe, ATTRIBUTE_LABEL[attribute], '?'].join(
      ' ',
    ),
    shape: shape.key,
    shapeB: null,
    choices: buildChoices(
      String(count),
      nearbyNumbers(count, 5, rand).map(String),
      choicesCount,
      rand,
    ),
    answer: String(count),
  };
}

// ─── angle_droit ────────────────────────────────────────────────────────────

function generateAngleDroit(
  pool: ShapeMeta[],
  choicesCount: number,
  rand: Rand,
): GeometrieQuestion | null {
  if (pool.length === 0) return null;
  const shape = pick(pool, rand);
  const answer = shape.angleDroit ? 'Oui' : 'Non';
  return {
    item_key: `angle_droit_${shape.key}`,
    type: 'angle_droit',
    skill_key: shape.key,
    display: 'Est-ce que cette figure a un angle droit ?',
    shape: shape.key,
    shapeB: null,
    // Fait binaire : toujours Oui/Non en QCM, quelle que soit la difficulté demandée.
    choices: choicesCount <= 0 ? [] : ['Oui', 'Non'],
    answer,
  };
}

// ─── proprietes ─────────────────────────────────────────────────────────────

type Propriete = 'angleDroit' | 'cotesEgaux';
const PROPRIETES: Propriete[] = ['angleDroit', 'cotesEgaux'];

const PROPRIETE_QUESTION: Record<Propriete, string> = {
  angleDroit: 'Laquelle de ces deux figures a un angle droit ?',
  cotesEgaux:
    'Laquelle de ces deux figures a tous ses côtés de la même longueur ?',
};

interface ProprietePaire {
  a: ShapeMeta;
  b: ShapeMeta;
  propriete: Propriete;
}

/** Toutes les paires de figures actives qui se départagent sur une propriété
 * (l'une l'a, l'autre non) : c'est ce qui rend la question intéressante. */
function findPairesProprietes(planeShapes: ShapeMeta[]): ProprietePaire[] {
  const pairs: ProprietePaire[] = [];
  for (let i = 0; i < planeShapes.length; i++) {
    for (let j = i + 1; j < planeShapes.length; j++) {
      const a = planeShapes[i];
      const b = planeShapes[j];
      for (const propriete of PROPRIETES) {
        const valeurA = a[propriete];
        const valeurB = b[propriete];
        if (valeurA === null || valeurB === null) continue;
        if (valeurA !== valeurB) pairs.push({ a, b, propriete });
      }
    }
  }
  return pairs;
}

function generateProprietes(
  planeShapes: ShapeMeta[],
  choicesCount: number,
  rand: Rand,
): GeometrieQuestion | null {
  const pairs = findPairesProprietes(planeShapes);
  if (pairs.length === 0) return null;
  const { a, b, propriete } = pick(pairs, rand);
  const correct = a[propriete] ? a : b;
  const [key1, key2] = [a.key, b.key].sort();

  return {
    item_key: `proprietes_${key1}_${key2}_${propriete}`,
    type: 'proprietes',
    skill_key: `${key1}_${key2}`,
    display: PROPRIETE_QUESTION[propriete],
    shape: a.key,
    shapeB: b.key,
    choices: choicesCount <= 0 ? [] : shuffle([a.nom, b.nom], rand),
    answer: correct.nom,
  };
}

// ─── Composition d'une séance ───────────────────────────────────────────────

export function generateQuestion(
  type: QuestionType,
  activeShapes: ShapeMeta[],
  choicesCount: number,
  rand: Rand,
): GeometrieQuestion | null {
  switch (type) {
    case 'nom_figure':
      return generateNom(
        'nom_figure',
        activeShapes.filter((shape) => shape.type === 'plane'),
        choicesCount,
        rand,
      );
    case 'nom_solide':
      return generateNom(
        'nom_solide',
        activeShapes.filter((shape) => shape.type === 'solide'),
        choicesCount,
        rand,
      );
    case 'cotes_sommets':
      return generateCotesSommets(activeShapes, choicesCount, rand);
    case 'angle_droit':
      return generateAngleDroit(
        activeShapes.filter(
          (shape) => shape.type === 'plane' && shape.angleDroit !== null,
        ),
        choicesCount,
        rand,
      );
    case 'proprietes':
      return generateProprietes(
        activeShapes.filter((shape) => shape.type === 'plane'),
        choicesCount,
        rand,
      );
  }
}

export function generateQuestions(
  count: number,
  types: QuestionType[],
  activeShapes: ShapeMeta[],
  choicesCount: number,
  rand: Rand,
): GeometrieQuestion[] {
  const questions: GeometrieQuestion[] = [];
  const used = new Set<string>();
  let attempts = 0;

  while (
    questions.length < count &&
    attempts < count * 15 &&
    types.length > 0
  ) {
    attempts++;
    const type = pick(types, rand);
    const question = generateQuestion(type, activeShapes, choicesCount, rand);
    if (!question || used.has(question.item_key)) continue;
    used.add(question.item_key);
    questions.push(question);
  }

  return questions;
}
