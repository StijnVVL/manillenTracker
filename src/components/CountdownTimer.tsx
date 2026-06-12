import { formatTime } from '../hooks/useRoundTimer';

interface CountdownTimerProps {
  remainingMs: number;
  elapsedMs: number;
  roundNumber: number;
  isWarning?: boolean;
}

export function CountdownTimer({
  remainingMs,
  elapsedMs,
  roundNumber,
  isWarning = false,
}: CountdownTimerProps) {
  return (
    <section className="timer-section">
      <div className="timer-round-label">Round {roundNumber}</div>
      <div className={`countdown ${isWarning ? 'countdown-warning' : ''}`}>
        {formatTime(remainingMs)}
      </div>
      <div className="countdown-elapsed">Elapsed: {formatTime(elapsedMs)}</div>
    </section>
  );
}
