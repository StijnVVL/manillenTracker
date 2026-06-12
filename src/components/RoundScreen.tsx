import { useCallback } from 'react';
import { useTournament } from '../context/TournamentContext';
import { useRoundTimer } from '../hooks/useRoundTimer';
import { getCurrentRound, getLatestRoundDiffs } from '../utils/teams';
import { CountdownTimer } from './CountdownTimer';
import { LadderBoard } from './LadderBoard';
import { MatchupList } from './MatchupList';
import { RoundHistory } from './RoundHistory';

function playTimeUpBeep() {
  try {
    const context = new AudioContext();
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;
    gain.gain.value = 0.15;
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start();
    oscillator.stop(context.currentTime + 0.35);
  } catch {
    // Audio not available in all environments.
  }
}

export function RoundScreen() {
  const { state, dispatch } = useTournament();
  const currentRound = getCurrentRound(state);

  const handleTimeUp = useCallback(() => {
    playTimeUpBeep();
  }, []);

  const { start, pause, endRound } = useRoundTimer({
    state,
    dispatch,
    onTimeUp: handleTimeUp,
  });

  if (!currentRound) return null;

  const isRunning = state.timerStatus === 'running';
  const isPaused = state.timerStatus === 'paused';
  const isIdle = state.timerStatus === 'idle';
  const isWarning = state.remainingMs <= 5 * 60 * 1000 && state.remainingMs > 0;
  const roundDiffs = getLatestRoundDiffs(state);

  return (
    <>
      <CountdownTimer
        remainingMs={state.remainingMs}
        elapsedMs={currentRound.elapsedMs}
        roundNumber={currentRound.number}
        isWarning={isWarning}
      />

      <div className="timer-controls">
        {(isIdle || isPaused) && (
          <button type="button" className="btn btn-primary" onClick={start}>
            {isPaused ? 'Resume' : 'Start Round'}
          </button>
        )}
        {isRunning && (
          <button type="button" className="btn btn-secondary" onClick={pause}>
            Pause
          </button>
        )}
        <button
          type="button"
          className="btn btn-danger"
          onClick={endRound}
          disabled={state.timerStatus === 'ended'}
        >
          End Round
        </button>
      </div>

      <div className="grid-2" style={{ marginTop: '1.5rem' }}>
        <LadderBoard
          teams={state.teams}
          ladder={state.ladder}
          roundDiffs={roundDiffs}
        />
        <MatchupList round={currentRound} teams={state.teams} />
      </div>

      <div style={{ marginTop: '1rem' }}>
        <RoundHistory
          rounds={state.rounds}
          teams={state.teams}
          currentRoundIndex={state.currentRoundIndex}
        />
      </div>
    </>
  );
}
