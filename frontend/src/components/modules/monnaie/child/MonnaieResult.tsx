import { useLocation, useNavigate } from 'react-router-dom';
import type { MonnaieQuestion } from 'src/types';
import GameResultPage from 'src/components/common/GameResultPage';
import { formatCents } from '../constants/denominations';

export interface MonnaieHistoryEntry {
  question: MonnaieQuestion;
  given: number | null;
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
  const errors = history.filter((entry) => !entry.correct);

  return (
    <GameResultPage
      correctCount={correctCount}
      total={total}
      onReplay={() => navigate('/module/monnaie/play', { state: { exerciseType } })}
      onHome={() => navigate('/module/monnaie')}
      homeLabel="Choisir un exercice"
      errorCount={errors.length}
    >
      {errors.map((entry, entryIndex) => (
        <li key={entryIndex} className="GameResult__errorItem">
          <div className="GameResult__errorLeft">
            <span className="GameResult__errorOp">{questionSummary(entry.question)}</span>
            {entry.timeout && <span className="GameResult__errorTimeout">⏰ Trop tard</span>}
            {!entry.timeout && entry.given !== null && (
              <span className="GameResult__errorGiven">
                Réponse donnée : {formatCents(entry.given)}
              </span>
            )}
          </div>
          <span className="GameResult__errorAnswer">{formatCents(entry.question.answer)}</span>
        </li>
      ))}
    </GameResultPage>
  );
}
