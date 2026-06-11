interface GameTimerBarProps {
  timerPct: number;       // 0-100
  isUrgent?: boolean;
}

/** Barre de temps restant (en haut de l'écran de jeu). */
export default function GameTimerBar({ timerPct, isUrgent = false }: GameTimerBarProps) {
  return (
    <div className="GameTimerBar">
      <div
        className={`GameTimerBar__fill${isUrgent ? ' GameTimerBar__fill--urgent' : ''}`}
        style={{ width: `${timerPct}%` }}
      />
    </div>
  );
}
