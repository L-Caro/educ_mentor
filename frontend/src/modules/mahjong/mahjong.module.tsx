import type { ModuleManifest } from 'src/types/modules.types';
import { MAHJONG_SETUP_OPTIONS } from './mahjong.setup';
import MahjongGame from './MahjongGame';

/**
 * Module hors-moule (comme Snake, Memory, Morpion) : pas de question/réponse, `child.Game`
 * court-circuite <LazyGame> + <GameEngine>.
 *
 * `skipDifficulty` n'est pas décoratif. Le pré-jeu INJECTE sa propre question de niveau
 * à tout module qui ne déclare pas la clé `difficulty` : « 2 choix / 4 choix / Saisie
 * libre », ce qui ne veut rien dire sur un plateau de Mahjong. Le module a eu sa propre
 * clé `difficulty` tant qu'il avait trois modes ; en la retirant, il fallait fermer la
 * porte derrière, sinon la question revenait par la bande.
 */
export const mahjongModule: ModuleManifest = {
  id: 'mahjong',
  category: 'jeux',
  setupOptions: MAHJONG_SETUP_OPTIONS,
  skipDifficulty: true,
  child: { Game: MahjongGame },
  adminTabs: [],
  adminRoutes: [],
};
