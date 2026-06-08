import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useLocation } from 'react-router-dom';

export const DURATION_KEY = 'maeve_session_duration'; // minutes, 0 = disabled
export const START_KEY    = 'maeve_session_start';    // timestamp ms

interface SessionTimerContextValue {
  remaining:   number;  // seconds, -1 if disabled
  isExpired:   boolean;
  showOverlay: boolean;
  resetTimer:  () => void;
  duration:    number;  // minutes, 0 = disabled
}

const SessionTimerContext = createContext<SessionTimerContextValue>({
  remaining: -1, isExpired: false, showOverlay: false, resetTimer: () => {}, duration: 0,
});

export function useSessionTimer() {
  return useContext(SessionTimerContext);
}

function computeRemaining(durationMin: number): number {
  const start = parseInt(localStorage.getItem(START_KEY) ?? '0', 10);
  if (!start) return durationMin * 60;
  return Math.max(0, durationMin * 60 - Math.floor((Date.now() - start) / 1000));
}

export function SessionTimerProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const duration = parseInt(localStorage.getItem(DURATION_KEY) ?? '0', 10);

  const [remaining, setRemaining] = useState<number>(() => {
    if (duration <= 0) return -1;
    return computeRemaining(duration);
  });

  useEffect(() => {
    if (duration <= 0) return;
    if (!localStorage.getItem(START_KEY)) {
      localStorage.setItem(START_KEY, String(Date.now()));
    }
    const id = setInterval(() => setRemaining(computeRemaining(duration)), 1000);
    return () => clearInterval(id);
  }, [duration]); // eslint-disable-line react-hooks/exhaustive-deps

  function resetTimer() {
    localStorage.setItem(START_KEY, String(Date.now()));
    setRemaining(duration * 60);
  }

  const isExpired   = duration > 0 && remaining === 0;
  const { pathname } = location;
  const isOnPlay    = pathname.endsWith('/play');
  const isOnResult  = pathname.endsWith('/result');
  const showOverlay = isExpired && !isOnPlay && !isOnResult;

  return (
    <SessionTimerContext.Provider value={{ remaining, isExpired, showOverlay, resetTimer, duration }}>
      {children}
    </SessionTimerContext.Provider>
  );
}
