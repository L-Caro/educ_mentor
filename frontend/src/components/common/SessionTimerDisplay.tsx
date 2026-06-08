import { useSessionTimer } from 'src/context/SessionTimerContext';

function formatRemaining(seconds: number): string {
  if (seconds > 60) return `${Math.ceil(seconds / 60)} min`;
  if (seconds > 0)  return `${seconds} s`;
  return '0 s';
}

export default function SessionTimerDisplay() {
  const { remaining, duration } = useSessionTimer();
  if (duration <= 0 || remaining < 0) return null;

  const isWarning = remaining <= 120;

  return (
    <div className={`SessionTimerDisplay${isWarning ? ' SessionTimerDisplay--warning' : ''}`}>
      <span className="SessionTimerDisplay__icon">⏱</span>
      <span className="SessionTimerDisplay__time">{formatRemaining(remaining)}</span>
    </div>
  );
}
