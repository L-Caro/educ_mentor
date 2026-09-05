/** Les opérations autorisées dans un compte, et la classe où chacune s'apprend.
 *
 * Le jeu télévisé donne les quatre d'emblée. Ici, non : une enfant qui n'a pas vu la
 * division ne doit pas la trouver dans la liste des touches. Les quatre sont donc
 * PRÉSENTES MAIS certaines FERMÉES, comme les figures de la géométrie ou les temps de la
 * conjugaison — on ouvre depuis Administration → Le compte est bon.
 *
 * La clé est le signe lui-même. C'est aussi ce que manipule le générateur : une table de
 * correspondance `plus → '+'` n'ajouterait qu'un endroit où se tromper.
 */

import type { Niveau } from '../../common/niveau';
import type { Operation } from './compte.generator';

export interface CompteOperationMeta {
  key: Operation;
  label: string;
  exemple: string;
  niveau: Niveau;
  defaultActive: boolean;
}

export const COMPTE_OPERATIONS: CompteOperationMeta[] = [
  {
    key: '+',
    label: 'Addition',
    exemple: '75 + 25 = 100',
    niveau: 'cp',
    defaultActive: true,
  },
  {
    key: '-',
    label: 'Soustraction',
    exemple: '100 − 25 = 75',
    niveau: 'cp',
    defaultActive: true,
  },
  {
    key: '×',
    label: 'Multiplication',
    exemple: '25 × 4 = 100',
    niveau: 'ce2',
    defaultActive: false,
  },
  {
    key: '÷',
    label: 'Division',
    exemple: '100 ÷ 4 = 25',
    niveau: 'cm1',
    defaultActive: false,
  },
];

const BY_KEY = new Map(COMPTE_OPERATIONS.map((o) => [o.key, o]));

export const DEFAULT_ACTIVE_COMPTE_OPERATIONS: Operation[] =
  COMPTE_OPERATIONS.filter((o) => o.defaultActive).map((o) => o.key);

export function isCompteOperation(value: unknown): value is Operation {
  return typeof value === 'string' && BY_KEY.has(value as Operation);
}
