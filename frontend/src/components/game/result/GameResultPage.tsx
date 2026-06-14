import type { ReactNode } from 'react';
import Button from 'src/components/common/Button.tsx';
import PageContainer from 'src/components/layout/PageContainer/PageContainer.tsx';

interface GameResultPageProps {
  correctCount: number;
  total?: number;
  scoreLabel?: string;
  onReplay: () => void;
  onHome: () => void;
  homeLabel?: string;
  errorCount?: number;
  children?: ReactNode;
}

export default function GameResultPage({
  correctCount,
  total,
  scoreLabel = 'de bonnes réponses',
  onReplay,
  onHome,
  homeLabel = 'Accueil',
  errorCount = 0,
  children,
}: GameResultPageProps) {
  const hasTotal = total !== undefined && total > 0;
  const percentage = hasTotal ? Math.round((correctCount / total!) * 100) : null;
  const emoji = percentage !== null
    ? (percentage === 100 ? '🏆' : percentage >= 80 ? '⭐' : percentage >= 50 ? '👍' : '💪')
    : null;
  const filledStars = percentage !== null ? Math.min(5, Math.floor(percentage / 20)) : null;

  return (
    <PageContainer className="GameResult">
      <div className="GameResult__score">
        {emoji && <span className="GameResult__emoji">{emoji}</span>}
        {filledStars !== null && (
          <div className="GameResult__stars">
            {'★'.repeat(filledStars)}{'☆'.repeat(5 - filledStars)}
          </div>
        )}
        {hasTotal ? (
          <>
            <p className="GameResult__fraction">{correctCount} / {total}</p>
            <p className="GameResult__pct">{percentage}% {scoreLabel}</p>
          </>
        ) : (
          <p className="GameResult__fraction">{correctCount} <span className="GameResult__scoreLabel">{scoreLabel}</span></p>
        )}
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
