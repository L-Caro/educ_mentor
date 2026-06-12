import type { ReactNode } from 'react';
import Button from 'src/components/common/Button.tsx';
import PageContainer from 'src/components/layout/PageContainer/PageContainer.tsx';

interface GameResultPageProps {
  correctCount: number;
  total: number;
  onReplay: () => void;
  onHome: () => void;
  homeLabel?: string;
  errorCount?: number;
  children?: ReactNode;
}

export default function GameResultPage({
  correctCount,
  total,
  onReplay,
  onHome,
  homeLabel = 'Accueil',
  errorCount = 0,
  children,
}: GameResultPageProps) {
  const percentage = total === 0 ? 0 : Math.round((correctCount / total) * 100);
  const emoji = percentage === 100 ? '🏆' : percentage >= 80 ? '⭐' : percentage >= 50 ? '👍' : '💪';
  const filledStars = Math.min(5, Math.floor(percentage / 20));

  return (
    <PageContainer className="GameResult">
      <div className="GameResult__score">
        <span className="GameResult__emoji">{emoji}</span>
        <div className="GameResult__stars">
          {'★'.repeat(filledStars)}{'☆'.repeat(5 - filledStars)}
        </div>
        <p className="GameResult__fraction">{correctCount} / {total}</p>
        <p className="GameResult__pct">{percentage}% de bonnes réponses</p>
      </div>

      {errorCount > 0 && (
        <div className="GameResult__errors">
          <p className="GameResult__errorsTitle">À retravailler ({errorCount})</p>
          <ul className="GameResult__errorsList">
            {children}
          </ul>
        </div>
      )}

      <div className="GameResult__actions">
        <Button title="Rejouer" onClick={onReplay} />
        <Button title={homeLabel} className="GameResult__btnOutline" onClick={onHome} />
      </div>
    </PageContainer>
  );
}
