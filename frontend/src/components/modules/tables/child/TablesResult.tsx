import { useLocation, useNavigate } from 'react-router-dom';
import type { TablesQuestion } from 'src/types';
import Button from 'src/components/common/Button';
import PageContainer from 'src/components/layout/PageContainer/PageContainer';

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
  const percentage = Math.round((correctCount / total) * 100);
  const errors = results.filter((r) => !r.wasCorrect);
  const emoji = percentage === 100 ? '🏆' : percentage >= 80 ? '⭐' : percentage >= 50 ? '👍' : '💪';
  const filledStars = Math.min(5, Math.floor(percentage / 20));

  return (
    <PageContainer className="TablesResult">
      <div className="TablesResult__score">
        <span className="TablesResult__emoji">{emoji}</span>
        <div className="TablesResult__stars">
          {'★'.repeat(filledStars)}{'☆'.repeat(5 - filledStars)}
        </div>
        <p className="TablesResult__fraction">{correctCount} / {total}</p>
        <p className="TablesResult__pct">{percentage}% de bonnes réponses</p>
      </div>

      {errors.length > 0 && (
        <div className="TablesResult__errors">
          <p className="TablesResult__errorsTitle">À retravailler ({errors.length})</p>
          <ul className="TablesResult__errorsList">
            {errors.map(({ question }) => (
              <li key={question.fact_id} className="TablesResult__errorItem">
                <span className="TablesResult__errorFact">
                  {question.display_a} × {question.display_b}
                </span>
                <span className="TablesResult__errorArrow">→</span>
                <span className="TablesResult__errorAnswer">{question.answer}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="TablesResult__actions">
        <Button title="Rejouer 🔄" onClick={() => navigate(-1 as never)} />
        <button className="TablesResult__btnOutline" onClick={() => navigate('/')}>
          Accueil
        </button>
      </div>
    </PageContainer>
  );
}
