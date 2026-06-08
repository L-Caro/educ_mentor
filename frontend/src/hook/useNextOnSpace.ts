import { useEffect } from 'react';

type AnswerState = 'idle' | 'correct' | 'wrong' | 'timeout';

export function useNextOnSpace(answerState: AnswerState, handleNext: () => void) {
  useEffect(() => {
    if (answerState === 'idle') return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === ' ') {
        e.preventDefault();
        handleNext();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [answerState]); // eslint-disable-line react-hooks/exhaustive-deps
}