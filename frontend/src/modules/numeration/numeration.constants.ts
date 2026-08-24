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

/** Rangs du plus grand au plus petit, l'ordre dans lequel une décomposition se lit et
 * s'écrit. Le serveur envoie `decompose_positions` MÉLANGÉ (c'est voulu : l'enfant doit
 * réfléchir à quel rang va où), ce qui rend une fiche illisible si on le reprend tel quel. */
export const POSITION_ORDER: PositionKey[] = ['cm', 'dm', 'm', 'c', 'd', 'u'];
