import type { ReactNode } from 'react';

interface GameCardProps {
  shake?: boolean;       // déclenche l'animation de secousse (mauvaise réponse / timeout)
  children: ReactNode;
}

/** Carte de question partagée : fond, ombre, et feedback shake sur erreur. */
export default function GameCard({ shake = false, children }: GameCardProps) {
  return (
    <div className={`GameCard${shake ? ' GameCard--shake' : ''}`}>
      
      {children}
    </div>
  );
}
