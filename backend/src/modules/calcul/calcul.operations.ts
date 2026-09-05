/** Les types de calcul mental, du CP au CM2, et la classe où chacun s'apprend.
 *
 * Le module s'arrêtait aux quatre opérations additives plus doubles et moitiés, et la
 * liste vivait en dur dans le pré-jeu, sans porte d'administration. Un enfant de CE1
 * aurait vu « division » dans ses cases, et rien ne l'aurait filtrée.
 *
 * Désormais : catalogue ici, porte en administration, pré-jeu chargé depuis le serveur.
 * Le `niveau` est une ÉTIQUETTE pour savoir quand ouvrir ; c'est la liste des types actifs
 * qui décide.
 *
 * ── Deux façons de borner ────────────────────────────────────────────────────────────
 *
 * `calcul_max_value` (20 par défaut) borne le calcul ADDITIF : « jusqu'à combien elle
 * additionne de tête ». Elle n'a aucun sens pour une multiplication, avec 20, seuls
 * 2×2 à 4×5 passeraient, et la table de 7 ne sortirait jamais. Les types multiplicatifs
 * portent donc leurs propres bornes, tirées des tables.
 */

import type { Niveau } from '../../common/niveau';

export type OperationType =
  | 'complement'
  | 'addition'
  | 'soustraction'
  | 'double'
  | 'moitie'
  | 'multiplication'
  | 'division'
  | 'multiplier_10'
  | 'diviser_10'
  | 'complement_100';

export interface OperationMeta {
  key: OperationType;
  label: string;
  /** Un exemple, qui dit mieux que le nom ce que l'enfant va voir. */
  exemple: string;
  niveau: Niveau;
  defaultActive: boolean;
  /** `valeur` : borné par `calcul_max_value`. `tables` : borné par ses propres tables. */
  borne: 'valeur' | 'tables';
}

/** Dans l'ordre du programme, pas dans l'ordre alphabétique. */
export const OPERATIONS: OperationMeta[] = [
  {
    key: 'addition',
    label: 'Additions',
    exemple: '3 + 4 = ?',
    niveau: 'cp',
    defaultActive: true,
    borne: 'valeur',
  },
  {
    key: 'soustraction',
    label: 'Soustractions',
    exemple: '10 − 3 = ?',
    niveau: 'cp',
    defaultActive: true,
    borne: 'valeur',
  },
  {
    key: 'complement',
    label: 'Compléments',
    exemple: '3 + ? = 10',
    niveau: 'cp',
    defaultActive: true,
    borne: 'valeur',
  },
  {
    key: 'double',
    label: 'Doubles',
    exemple: 'Double de 6 = ?',
    niveau: 'ce1',
    defaultActive: true,
    borne: 'valeur',
  },
  {
    key: 'moitie',
    label: 'Moitiés',
    exemple: 'Moitié de 12 = ?',
    niveau: 'ce1',
    defaultActive: true,
    borne: 'valeur',
  },
  {
    key: 'multiplication',
    label: 'Multiplications',
    exemple: '7 × 8 = ?',
    niveau: 'ce2',
    defaultActive: false,
    borne: 'tables',
  },
  {
    key: 'complement_100',
    label: 'Compléments à 100',
    exemple: '65 pour aller à 100',
    niveau: 'ce2',
    defaultActive: false,
    borne: 'tables',
  },
  {
    key: 'multiplier_10',
    label: 'Multiplier par 10, 100, 1000',
    exemple: '34 × 100 = ?',
    niveau: 'ce2',
    defaultActive: false,
    borne: 'tables',
  },
  {
    key: 'division',
    label: 'Divisions',
    exemple: '56 ÷ 7 = ?',
    niveau: 'cm1',
    defaultActive: false,
    borne: 'tables',
  },
  {
    key: 'diviser_10',
    label: 'Diviser par 10, 100, 1000',
    exemple: '4 500 ÷ 100 = ?',
    niveau: 'cm1',
    defaultActive: false,
    borne: 'tables',
  },
];

const BY_KEY = new Map(OPERATIONS.map((o) => [o.key, o]));

export const OPERATION_KEYS: OperationType[] = OPERATIONS.map((o) => o.key);

export const DEFAULT_ACTIVE_OPERATIONS: OperationType[] = OPERATIONS.filter(
  (o) => o.defaultActive,
).map((o) => o.key);

export function isOperationType(value: unknown): value is OperationType {
  return typeof value === 'string' && BY_KEY.has(value as OperationType);
}

export function getOperation(key: OperationType): OperationMeta {
  const operation = BY_KEY.get(key);
  if (!operation) throw new Error(`Type de calcul inconnu : ${key}`);
  return operation;
}
