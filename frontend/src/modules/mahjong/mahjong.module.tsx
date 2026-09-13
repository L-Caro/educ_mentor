import type { ModuleManifest } from 'src/types/modules.types';
import { MAHJONG_SETUP_OPTIONS } from './mahjong.setup';
import MahjongGame from './MahjongGame';

/**
 * Module hors-moule (comme Snake, Memory, Morpion) : pas de question/réponse, `child.Game`
 * court-circuite <LazyGame> + <GameEngine>. Les trois modes de difficulté sont prêts
 * (EM-38 à EM-41) et le module est actif côté catalogue (EM-42).
 */
export const mahjongModule: ModuleManifest = {
  id: 'mahjong',
  category: 'jeux',
  setupOptions: MAHJONG_SETUP_OPTIONS,
  child: { Game: MahjongGame },
  adminTabs: [],
  adminRoutes: [],
};
