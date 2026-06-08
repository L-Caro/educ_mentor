import { useLocation, useNavigate } from 'react-router-dom';
import GameResultPage from 'src/components/common/GameResultPage';

export interface CalculHistoryEntry {
  operation: string;
  answer: number;
  given: number | null;
  correct: boolean;
  timeout: boolean;
}

interface ResultState {
  correctCount: number;
  total: number;
  history: CalculHistoryEntry[];
}

export default function CalculResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultState | null;

  if (!state) { navigate('/module/calcul-mental'); return null; }

  const { correctCount, total, history } = state;
  const errors = history.filter((entry) => !entry.correct);

  return (
    <GameResultPage
      correctCount={correctCount}
      total={total}
      onReplay={() => navigate('/module/calcul-mental/play')}
      onHome={() => navigate('/')}
      errorCount={errors.length}
    >
      {errors.map((entry, entryIndex) => (
        <li key={entryIndex} className="GameResult__errorItem">
          <div className="GameResult__errorLeft">
            <span className="GameResult__errorOp">{entry.operation.replace('?', '___')}</span>
            {entry.timeout && <span className="GameResult__errorTimeout">⏰ Trop tard</span>}
            {!entry.timeout && entry.given !== null && (
              <span className="GameResult__errorGiven">Réponse donnée : {entry.given}</span>
            )}
          </div>
          <span className="GameResult__errorAnswer">{entry.answer}</span>
        </li>
      ))}
    </GameResultPage>
  );
}
