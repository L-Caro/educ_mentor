import type { PositionKey } from './numeration.type';

/** Nom de chaque rang, du plus petit au plus grand. Partagé par la correction affichée
 * pendant le jeu et par la fiche de leçon : les deux nomment les mêmes rangs. */
export const POSITION_NAME: Record<PositionKey, string> = {
  u: 'unités',
  d: 'dizaines',
  c: 'centaines',
  m: 'milliers',
  dm: 'dizaines de milliers',
  cm: 'centaines de milliers',
};
