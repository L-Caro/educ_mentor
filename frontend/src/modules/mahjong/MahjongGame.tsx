import { useAppSelector } from 'src/hooks';
import { selectModuleSetup } from 'src/store/slice/gameSetupSlice';
import MahjongFacile from './MahjongFacile';
import MahjongMoyen from './MahjongMoyen';
import MahjongDifficile from './MahjongDifficile';

const MODULE_ID = 'mahjong';

/**
 * Dispatcher de difficulte : chaque mode a son propre plateau et sa propre regle
 * d'appariement (EM-39 Facile, EM-40 Moyen, EM-41 Difficile). Ce composant ne fait que
 * choisir lequel afficher ; la logique de jeu vit entierement dans chaque mode.
 */
export default function MahjongGame() {
  const setup = useAppSelector(selectModuleSetup(MODULE_ID)) ?? {};
  const difficulty = (setup['difficulty'] as string | undefined) ?? 'facile';

  if (difficulty === 'moyen') return <MahjongMoyen />;
  if (difficulty === 'difficile') return <MahjongDifficile />;
  return <MahjongFacile />;
}
