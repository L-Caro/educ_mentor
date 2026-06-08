import { useEffect, useRef, useState } from 'react';

interface UseQuestionTimerResult {
  timeRemaining: number;
  timerPct: number;
  isUrgent: boolean;
  startTimer: () => void;
  stopTimer: () => void;
}

/**
 * Timer fluide ancré sur Date.now() — 100ms d'intervalle évite la dérive d'un
 * timer secondaire et permet une transition CSS smooth (0.08s).
 * Le callback onTimeout est toujours appelé dans sa version la plus récente.
 */
export function useQuestionTimer(timerSeconds: number, onTimeout: () => void): UseQuestionTimerResult {
  const [timeRemaining, setTimeRemaining] = useState(timerSeconds);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isRunningRef = useRef(false);
  const startTimeRef = useRef(0);
  const timerSecondsRef = useRef(timerSeconds);
  const onTimeoutRef = useRef(onTimeout);

  useEffect(() => { timerSecondsRef.current = timerSeconds; }, [timerSeconds]);
  useEffect(() => { onTimeoutRef.current = onTimeout; }, [onTimeout]);

  useEffect(() => () => { stopTimer(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function stopTimer() {
    isRunningRef.current = false;
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }

  function startTimer() {
    const seconds = timerSecondsRef.current;
    stopTimer();
    if (seconds <= 0) return;

    isRunningRef.current = true;
    startTimeRef.current = Date.now();
    setTimeRemaining(seconds);

    intervalRef.current = setInterval(() => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      const remaining = Math.max(0, seconds - elapsed);
      setTimeRemaining(remaining);

      if (remaining === 0) {
        isRunningRef.current = false;
        clearInterval(intervalRef.current!);
        intervalRef.current = null;
        onTimeoutRef.current();
      }
    }, 100);
  }

  const timerPct = timerSeconds > 0 ? (timeRemaining / timerSeconds) * 100 : 100;
  const isUrgent = timerSeconds > 0 && timeRemaining <= 3;

  return { timeRemaining, timerPct, isUrgent, startTimer, stopTimer };
}
