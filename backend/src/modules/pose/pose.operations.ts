/** Les opérations posées, et la classe où chacune s'apprend.
 *
 * Le module s'arrêtait à l'addition et à la soustraction, et la liste vivait en dur dans
 * le pré-jeu. Il porte désormais la multiplication posée (CE2). Elle est PRÉSENTE MAIS
 * FERMÉE : on l'ouvre depuis Administration → Calcul posé, comme les figures de la
 * géométrie ou les temps de la conjugaison.
 *
 * La division posée n'y figure pas, et c'est délibéré : sa potence est une autre
 * géométrie — quotient construit de gauche à droite, abaissements successifs, reste — que
 * la grille en colonnes ne sait pas rendre. La déclarer ici sans savoir la jouer ouvrirait
 * une case qui ne produirait rien.
 */

import type { Niveau } from '../../common/niveau';
import type { PoseOperation } from './pose.generator';

export interface PoseOperationMeta {
  key: PoseOperation;
  label: string;
  exemple: string;
  niveau: Niveau;
  defaultActive: boolean;
}

export const POSE_OPERATIONS: PoseOperationMeta[] = [
  {
    key: 'addition',
    label: 'Additions',
    exemple: '247 + 138',
    niveau: 'ce1',
    defaultActive: true,
  },
  {
    key: 'soustraction',
    label: 'Soustractions',
    exemple: '2847 − 138',
    niveau: 'ce1',
    defaultActive: true,
  },
  {
    key: 'multiplication',
    label: 'Multiplications',
    exemple: '247 × 36',
    niveau: 'ce2',
    defaultActive: false,
  },
];

const BY_KEY = new Map(POSE_OPERATIONS.map((o) => [o.key, o]));

export const DEFAULT_ACTIVE_POSE_OPERATIONS: PoseOperation[] =
  POSE_OPERATIONS.filter((o) => o.defaultActive).map((o) => o.key);

export function isPoseOperation(value: unknown): value is PoseOperation {
  return typeof value === 'string' && BY_KEY.has(value as PoseOperation);
}
