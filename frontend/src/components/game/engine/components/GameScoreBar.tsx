interface GameScoreBarProps {
  filledStars: number;
  correctCount: number;
  total: number;                  // dénominateur affiché (total ou nombre de réponses selon le module)
  timeRemaining?: number | null;  // si défini → chip timer
  isUrgent?: boolean;
  streak?: number;                // si défini → chip série (Tables)
}

/**
 * Barre de score partagée : étoiles, chip timer optionnel, série optionnelle, compteur.
 */
export default function GameScoreBar({
  filledStars,
  correctCount,
  total,
  timeRemaining,
  isUrgent = false,
  streak,
}: GameScoreBarProps) {
  return (
    <div className="GameScoreBar">
      <div className="GameScoreBar__stars">
        {'★'.repeat(filledStars)}{'☆'.repeat(5 - filledStars)}
      </div>

      {timeRemaining != null && (
        <div className={`GameScoreBar__timer${isUrgent ? ' GameScoreBar__timer--urgent' : ''}`}>
          ⏱ {Math.ceil(timeRemaining)}s
        </div>
      )}

      {streak != null && (
        <div className="GameScoreBar__streak" data-active={streak > 0}>
          🔥 {streak} série
        </div>
      )}

      <div className="GameScoreBar__counter">{correctCount}/{total}</div>
    </div>
  );
}
