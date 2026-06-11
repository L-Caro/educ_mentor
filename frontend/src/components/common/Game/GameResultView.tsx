import { useLocation, useNavigate } from 'react-router-dom';
import GameResultPage from './GameResultPage';
import GameErrorList from './GameErrorList';
import type { GameResultEntry } from './gameResult';

interface ResultState {
  correctCount: number;
  total: number;
  results: GameResultEntry[];
}

/**
 * Écran de résultats générique, rendu par la route `/result` de chaque module à spec.
 * Remplace les composants `*Result` : garde l'état, filtre les erreurs, délègue le rendu
 * à `<GameResultPage>` + `<GameErrorList>`. Rejouer → `/play`, Accueil → `/`.
 */
export default function GameResultView({ moduleId }: { moduleId: string }) {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultState | null;

  if (!state) { navigate(`/module/${moduleId}`); return null; }

  const { correctCount, total, results } = state;
  const errors = results.filter((entry) => !entry.correct);

  return (
    <GameResultPage
      correctCount={correctCount}
      total={total}
      onReplay={() => navigate(`/module/${moduleId}/play`)}
      onHome={() => navigate('/')}
      errorCount={errors.length}
    >
      <GameErrorList errors={errors} />
    </GameResultPage>
  );
}
