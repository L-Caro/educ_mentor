import type { ReactNode } from 'react';
import type { GameAnswerState } from 'src/hook/useGameSession';

interface GameCorrectionProps {
  answerState: GameAnswerState;
  answer: ReactNode;   // la bonne réponse, déjà formatée par le module
}

/**
 * Message de correction partagé : s'affiche après une mauvaise réponse ou un timeout,
 * avec un texte unique pour tous les modules.
 */
export default function GameCorrection({ answerState, answer }: GameCorrectionProps) {
  if (answerState !== 'wrong' && answerState !== 'timeout') return null;

  return (
    <p className="GameCorrection">
      {answerState === 'timeout' && '⏰ Trop tard ! '}
      La réponse était <strong>{answer}</strong>
    </p>
  );
}
