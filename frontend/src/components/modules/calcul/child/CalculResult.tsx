import { useLocation, useNavigate } from 'react-router-dom';
import Button from 'src/components/common/Button';
import PageContainer from 'src/components/layout/PageContainer/PageContainer';

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
  const percentage = total === 0 ? 0 : Math.round((correctCount / total) * 100);
  const errors = history.filter((e) => !e.correct);
  const emoji = percentage === 100 ? '🏆' : percentage >= 80 ? '⭐' : percentage >= 50 ? '👍' : '💪';
  const filledStars = Math.min(5, Math.floor(percentage / 20));

  return (
    <PageContainer className="CalculResult">
      <div className="CalculResult__score">
        <span className="CalculResult__emoji">{emoji}</span>
        <div className="CalculResult__stars">
          {'★'.repeat(filledStars)}{'☆'.repeat(5 - filledStars)}
        </div>
        <p className="CalculResult__fraction">{correctCount} / {total}</p>
        <p className="CalculResult__pct">{percentage}% de bonnes réponses</p>
      </div>

      {errors.length > 0 && (
        <div className="CalculResult__errors">
          <p className="CalculResult__errorsTitle">À retravailler ({errors.length})</p>
          <ul className="CalculResult__errorsList">
            {errors.map((entry, i) => (
              <li key={i} className="CalculResult__errorItem">
                <div className="CalculResult__errorLeft">
                  <span className="CalculResult__errorOp">{entry.operation.replace('?', '___')}</span>
                  {entry.timeout && <span className="CalculResult__errorTimeout">⏰ Trop tard</span>}
                  {!entry.timeout && entry.given !== null && (
                    <span className="CalculResult__errorGiven">Réponse donnée : {entry.given}</span>
                  )}
                </div>
                <span className="CalculResult__errorAnswer">{entry.answer}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="CalculResult__actions">
        <Button title="Rejouer 🔄" onClick={() => navigate('/module/calcul-mental/play')} />
        <button className="CalculResult__btnOutline" onClick={() => navigate('/')}>
          Accueil
        </button>
      </div>
    </PageContainer>
  );
}
