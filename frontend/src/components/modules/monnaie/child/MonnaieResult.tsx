import { useLocation, useNavigate } from 'react-router-dom';
import type { MonnaieQuestion } from 'src/types';
import { formatCents } from '../constants/denominations';
import Button from 'src/components/common/Button';
import PageContainer from 'src/components/layout/PageContainer/PageContainer';

export interface MonnaieHistoryEntry {
  question: MonnaieQuestion;
  given: number | null;  // centimes
  correct: boolean;
  timeout: boolean;
}

interface ResultState {
  exerciseType: string;
  correctCount: number;
  total: number;
  history: MonnaieHistoryEntry[];
}

function questionSummary(question: MonnaieQuestion): string {
  switch (question.type) {
    case 'reconnaitre': return `${(question.coins ?? []).length} pièce(s)/billet(s)`;
    case 'total': return `Total de ${(question.prices ?? []).map(formatCents).join(' + ')}`;
    case 'rendre': return `${formatCents(question.price ?? 0)} → tu donnes ${formatCents(question.payment ?? 0)}`;
  }
}

export default function MonnaieResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultState | null;

  if (!state) { navigate('/module/monnaie'); return null; }

  const { exerciseType, correctCount, total, history } = state;
  const percentage = total === 0 ? 0 : Math.round((correctCount / total) * 100);
  const errors = history.filter((entry) => !entry.correct);
  const emoji = percentage === 100 ? '🏆' : percentage >= 80 ? '⭐' : percentage >= 50 ? '👍' : '💪';
  const filledStars = Math.min(5, Math.floor(percentage / 20));

  return (
    <PageContainer className="MonnaieResult">
      <div className="MonnaieResult__score">
        <span className="MonnaieResult__emoji">{emoji}</span>
        <div className="MonnaieResult__stars">
          {'★'.repeat(filledStars)}{'☆'.repeat(5 - filledStars)}
        </div>
        <p className="MonnaieResult__fraction">{correctCount} / {total}</p>
        <p className="MonnaieResult__pct">{percentage}% de bonnes réponses</p>
      </div>

      {errors.length > 0 && (
        <div className="MonnaieResult__errors">
          <p className="MonnaieResult__errorsTitle">À retravailler ({errors.length})</p>
          <ul className="MonnaieResult__errorsList">
            {errors.map((entry, entryIndex) => (
              <li key={entryIndex} className="MonnaieResult__errorItem">
                <div className="MonnaieResult__errorLeft">
                  <span className="MonnaieResult__errorOp">{questionSummary(entry.question)}</span>
                  {entry.timeout && <span className="MonnaieResult__errorTimeout">⏰ Trop tard</span>}
                  {!entry.timeout && entry.given !== null && (
                    <span className="MonnaieResult__errorGiven">
                      Réponse donnée : {formatCents(entry.given)}
                    </span>
                  )}
                </div>
                <span className="MonnaieResult__errorAnswer">{formatCents(entry.question.answer)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="MonnaieResult__actions">
        <Button
          title="Rejouer 🔄"
          onClick={() => navigate('/module/monnaie/play', { state: { exerciseType } })}
        />
        <button className="MonnaieResult__btnOutline" onClick={() => navigate('/module/monnaie')}>
          Choisir un exercice
        </button>
      </div>
    </PageContainer>
  );
}
