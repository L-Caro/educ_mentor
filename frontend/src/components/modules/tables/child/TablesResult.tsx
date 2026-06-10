import { useLocation, useNavigate } from 'react-router-dom';
import type { TablesQuestion } from 'src/types';
import GameResultPage from 'src/components/common/Game/GameResultPage.tsx';

interface ResultState {
  correctCount: number;
  total: number;
  results: { question: TablesQuestion; wasCorrect: boolean }[];
}

export default function TablesResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultState | null;

  if (!state) { navigate('/module/tables'); return null; }

  const { correctCount, total, results } = state;
  const errors = results.filter((result) => !result.wasCorrect);

  return (
    <GameResultPage
      correctCount={correctCount}
      total={total}
      onReplay={() => navigate(-1 as never)}
      onHome={() => navigate('/')}
      errorCount={errors.length}
    >
      {errors.map(({ question }) => (
        <li key={question.fact_id} className="GameResult__errorItem">
          <span className="GameResult__errorFact">{question.display_a} × {question.display_b}</span>
          <span className="GameResult__errorArrow">→</span>
          <span className="GameResult__errorAnswer">{question.answer}</span>
        </li>
      ))}
    </GameResultPage>
  );
}
