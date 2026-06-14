import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from 'src/hooks';
import { selectGameResult, clearGameResult } from 'src/store/slice/gameResultSlice';
import GameResultPage from './GameResultPage.tsx';
import GameErrorList from '../error/GameErrorList.tsx';

/**
 * Écran de résultats générique, rendu par la route `/result` de chaque module à spec.
 * Lit le résultat depuis le store Redux (setGameResult dispatché par useGameSession).
 * Vide le store au démontage pour éviter qu'un rechargement page affiche un résultat périmé.
 */
export default function GameResultView({ moduleId }: { moduleId: string }) {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const gameResult = useAppSelector(selectGameResult);

  useEffect(() => () => { dispatch(clearGameResult()); }, [dispatch]);

  if (!gameResult) { navigate(`/module/${moduleId}`); return null; }

  const { correctCount, total, scoreLabel, results } = gameResult;
  const errors = results.filter((entry) => !entry.correct);

  return (
    <GameResultPage
      correctCount={correctCount}
      total={total}
      scoreLabel={scoreLabel}
      onReplay={() => navigate(`/module/${moduleId}/play`)}
      onHome={() => navigate('/')}
      errorCount={errors.length}
    >
      <GameErrorList errors={errors} />
    </GameResultPage>
  );
}
