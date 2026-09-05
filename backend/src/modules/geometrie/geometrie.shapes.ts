/** Catalogue des formes du module géométrie : source unique des propriétés utilisées par
 * le générateur de questions. Les clés (`key`) doivent correspondre exactement à celles du
 * catalogue SVG frontend (`frontend/src/cours/components/catalogue-formes.tsx`) : un test de
 * cohérence (`frontend/src/__tests__/geometrie-shapes.test.ts`) le vérifie.
 *
 * `cotes`/`sommets`/`angleDroit`/`cotesEgaux` ne concernent que les figures planes ;
 * `faces`/`aretes` ne concernent que les solides. `null` = notion non pertinente pour cette
 * forme (un cercle n'a pas d'angle droit à avoir ou pas).
 *
 * `defaultActive` : les formes du programme CE1 (le gros des figures et solides « simples »).
 * Le reste, quadrilatères plus fins, polygones réguliers, solides moins courants, existe
 * dans le catalogue mais reste éteint tant qu'un réglage admin ne l'active pas : le module
 * grandit avec l'enfant sans jamais lui montrer plus que ce qu'elle a vu en classe.
 */

export const FAMILLES = [
  'triangle',
  'quadrilatere',
  'polygone',
  'cercle',
  'solide',
] as const;
export type Famille = (typeof FAMILLES)[number];

export interface ShapeMeta {
  key: string;
  nom: string;
  famille: Famille;
  type: 'plane' | 'solide';
  cotes: number | null;
  sommets: number | null;
  angleDroit: boolean | null;
  cotesEgaux: boolean | null;
  faces: number | null;
  aretes: number | null;
  defaultActive: boolean;
}

export const SHAPES: ShapeMeta[] = [
  // ── Triangles ──────────────────────────────────────────────────────────────
  {
    key: 'triangle',
    nom: 'triangle',
    famille: 'triangle',
    type: 'plane',
    cotes: 3,
    sommets: 3,
    angleDroit: false,
    cotesEgaux: false,
    faces: null,
    aretes: null,
    defaultActive: true,
  },
  {
    key: 'triangleRectangle',
    nom: 'triangle rectangle',
    famille: 'triangle',
    type: 'plane',
    cotes: 3,
    sommets: 3,
    angleDroit: true,
    cotesEgaux: false,
    faces: null,
    aretes: null,
    defaultActive: true,
  },
  {
    key: 'triangleIsocele',
    nom: 'triangle isocèle',
    famille: 'triangle',
    type: 'plane',
    cotes: 3,
    sommets: 3,
    angleDroit: false,
    cotesEgaux: false,
    faces: null,
    aretes: null,
    defaultActive: false,
  },
  {
    key: 'triangleEquilateral',
    nom: 'triangle équilatéral',
    famille: 'triangle',
    type: 'plane',
    cotes: 3,
    sommets: 3,
    angleDroit: false,
    cotesEgaux: true,
    faces: null,
    aretes: null,
    defaultActive: false,
  },

  // ── Quadrilatères ─────────────────────────────────────────────────────────
  {
    key: 'carre',
    nom: 'carré',
    famille: 'quadrilatere',
    type: 'plane',
    cotes: 4,
    sommets: 4,
    angleDroit: true,
    cotesEgaux: true,
    faces: null,
    aretes: null,
    defaultActive: true,
  },
  {
    key: 'rectangle',
    nom: 'rectangle',
    famille: 'quadrilatere',
    type: 'plane',
    cotes: 4,
    sommets: 4,
    angleDroit: true,
    cotesEgaux: false,
    faces: null,
    aretes: null,
    defaultActive: true,
  },
  {
    key: 'losange',
    nom: 'losange',
    famille: 'quadrilatere',
    type: 'plane',
    cotes: 4,
    sommets: 4,
    angleDroit: false,
    cotesEgaux: true,
    faces: null,
    aretes: null,
    defaultActive: false,
  },
  {
    key: 'parallelogramme',
    nom: 'parallélogramme',
    famille: 'quadrilatere',
    type: 'plane',
    cotes: 4,
    sommets: 4,
    angleDroit: false,
    cotesEgaux: false,
    faces: null,
    aretes: null,
    defaultActive: false,
  },
  {
    key: 'trapeze',
    nom: 'trapèze',
    famille: 'quadrilatere',
    type: 'plane',
    cotes: 4,
    sommets: 4,
    angleDroit: false,
    cotesEgaux: false,
    faces: null,
    aretes: null,
    defaultActive: false,
  },

  // ── Polygones réguliers ───────────────────────────────────────────────────
  {
    key: 'pentagone',
    nom: 'pentagone',
    famille: 'polygone',
    type: 'plane',
    cotes: 5,
    sommets: 5,
    angleDroit: false,
    cotesEgaux: true,
    faces: null,
    aretes: null,
    defaultActive: false,
  },
  {
    key: 'hexagone',
    nom: 'hexagone',
    famille: 'polygone',
    type: 'plane',
    cotes: 6,
    sommets: 6,
    angleDroit: false,
    cotesEgaux: true,
    faces: null,
    aretes: null,
    defaultActive: false,
  },
  {
    key: 'heptagone',
    nom: 'heptagone',
    famille: 'polygone',
    type: 'plane',
    cotes: 7,
    sommets: 7,
    angleDroit: false,
    cotesEgaux: true,
    faces: null,
    aretes: null,
    defaultActive: false,
  },
  {
    key: 'octogone',
    nom: 'octogone',
    famille: 'polygone',
    type: 'plane',
    cotes: 8,
    sommets: 8,
    angleDroit: false,
    cotesEgaux: true,
    faces: null,
    aretes: null,
    defaultActive: false,
  },
  {
    key: 'enneagone',
    nom: 'ennéagone',
    famille: 'polygone',
    type: 'plane',
    cotes: 9,
    sommets: 9,
    angleDroit: false,
    cotesEgaux: true,
    faces: null,
    aretes: null,
    defaultActive: false,
  },
  {
    key: 'decagone',
    nom: 'décagone',
    famille: 'polygone',
    type: 'plane',
    cotes: 10,
    sommets: 10,
    angleDroit: false,
    cotesEgaux: true,
    faces: null,
    aretes: null,
    defaultActive: false,
  },
  {
    key: 'hendecagone',
    nom: 'hendécagone',
    famille: 'polygone',
    type: 'plane',
    cotes: 11,
    sommets: 11,
    angleDroit: false,
    cotesEgaux: true,
    faces: null,
    aretes: null,
    defaultActive: false,
  },
  {
    key: 'dodecagone',
    nom: 'dodécagone',
    famille: 'polygone',
    type: 'plane',
    cotes: 12,
    sommets: 12,
    angleDroit: false,
    cotesEgaux: true,
    faces: null,
    aretes: null,
    defaultActive: false,
  },

  // ── Cercle ────────────────────────────────────────────────────────────────
  {
    key: 'cercle',
    nom: 'cercle',
    famille: 'cercle',
    type: 'plane',
    cotes: 0,
    sommets: 0,
    angleDroit: null,
    cotesEgaux: null,
    faces: null,
    aretes: null,
    defaultActive: true,
  },

  // ── Solides ───────────────────────────────────────────────────────────────
  {
    key: 'cube',
    nom: 'cube',
    famille: 'solide',
    type: 'solide',
    cotes: null,
    sommets: 8,
    angleDroit: null,
    cotesEgaux: null,
    faces: 6,
    aretes: 12,
    defaultActive: true,
  },
  {
    key: 'pave',
    nom: 'pavé droit',
    famille: 'solide',
    type: 'solide',
    cotes: null,
    sommets: 8,
    angleDroit: null,
    cotesEgaux: null,
    faces: 6,
    aretes: 12,
    defaultActive: true,
  },
  {
    key: 'pyramide',
    nom: 'pyramide',
    famille: 'solide',
    type: 'solide',
    cotes: null,
    sommets: 5,
    angleDroit: null,
    cotesEgaux: null,
    faces: 5,
    aretes: 8,
    defaultActive: true,
  },
  {
    key: 'pyramideBaseTriangulaire',
    nom: 'pyramide à base triangulaire',
    famille: 'solide',
    type: 'solide',
    cotes: null,
    sommets: 4,
    angleDroit: null,
    cotesEgaux: null,
    faces: 4,
    aretes: 6,
    defaultActive: false,
  },
  {
    key: 'cone',
    nom: 'cône',
    famille: 'solide',
    type: 'solide',
    cotes: null,
    sommets: 1,
    angleDroit: null,
    cotesEgaux: null,
    faces: 2,
    aretes: 1,
    defaultActive: true,
  },
  {
    key: 'cylindre',
    nom: 'cylindre',
    famille: 'solide',
    type: 'solide',
    cotes: null,
    sommets: 0,
    angleDroit: null,
    cotesEgaux: null,
    faces: 3,
    aretes: 2,
    defaultActive: false,
  },
  {
    key: 'boule',
    nom: 'boule',
    famille: 'solide',
    type: 'solide',
    cotes: null,
    sommets: 0,
    angleDroit: null,
    cotesEgaux: null,
    faces: 1,
    aretes: 0,
    defaultActive: false,
  },
  {
    key: 'prisme',
    nom: 'prisme à base triangulaire',
    famille: 'solide',
    type: 'solide',
    cotes: null,
    sommets: 6,
    angleDroit: null,
    cotesEgaux: null,
    faces: 5,
    aretes: 9,
    defaultActive: false,
  },
];

export type ShapeKey = string;

const SHAPE_BY_KEY = new Map(SHAPES.map((shape) => [shape.key, shape]));

export function isShapeKey(value: unknown): value is ShapeKey {
  return typeof value === 'string' && SHAPE_BY_KEY.has(value);
}

export function getShape(key: string): ShapeMeta {
  const shape = SHAPE_BY_KEY.get(key);
  if (!shape) throw new Error(`Forme inconnue : "${key}"`);
  return shape;
}

export const DEFAULT_ACTIVE_SHAPES: string[] = SHAPES.filter(
  (shape) => shape.defaultActive,
).map((shape) => shape.key);
