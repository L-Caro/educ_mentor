interface GameProgressBarProps {
  progress: number;   // 0-100
}

/** Barre de progression de la session (en haut de l'écran de jeu). */
export default function GameProgressBar({ progress }: GameProgressBarProps) {
  return (
    <div className="GameProgressBar">
      <div className="GameProgressBar__fill" style={{ width: `${progress}%` }} />
    </div>
  );
}
