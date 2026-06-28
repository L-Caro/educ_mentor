import type { ReactNode } from 'react';
import type { GameAnswerState } from 'src/hooks';

interface GameCorrectionProps {
  answerState: GameAnswerState;
  answer: ReactNode;
  message?: ReactNode; // remplace entièrement "La réponse était [answer]" si fourni
}

export default function GameCorrection({ answerState, answer, message }: GameCorrectionProps) {
  if (answerState !== 'wrong' && answerState !== 'timeout') return null;

  return (
    <p className="GameCorrection">
      {answerState === 'timeout' && '⏰ Trop tard ! '}
      {message ?? <>La réponse était <strong>{answer}</strong></>}
    </p>
  );
}
