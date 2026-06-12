import { useCallback, useEffect, useRef } from 'react';
import type { TournamentAction } from '../state/tournamentReducer';
import type { TournamentState } from '../types';

interface UseRoundTimerOptions {
  state: TournamentState;
  dispatch: React.Dispatch<TournamentAction>;
  onTimeUp?: () => void;
}

export function useRoundTimer({ state, dispatch, onTimeUp }: UseRoundTimerOptions) {
  const frameRef = useRef<number | null>(null);
  const startPerfRef = useRef<number>(0);
  const accumulatedElapsedRef = useRef(0);
  const onTimeUpRef = useRef(onTimeUp);

  useEffect(() => {
    onTimeUpRef.current = onTimeUp;
  }, [onTimeUp]);

  const totalDurationMs = state.roundDurationMinutes * 60 * 1000;
  const currentRound = state.currentRoundIndex >= 0 ? state.rounds[state.currentRoundIndex] : null;

  const stopAnimation = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }
  }, []);

  const syncTick = useCallback(
    (now: number) => {
      const elapsedSinceStart = now - startPerfRef.current;
      const elapsedMs = accumulatedElapsedRef.current + elapsedSinceStart;
      const remainingMs = Math.max(0, totalDurationMs - elapsedMs);

      dispatch({
        type: 'TICK_TIMER',
        remainingMs,
        elapsedMs,
      });

      if (remainingMs <= 0) {
        stopAnimation();
        dispatch({ type: 'END_ROUND', elapsedMs: totalDurationMs });
        onTimeUpRef.current?.();
        return;
      }

      frameRef.current = requestAnimationFrame(syncTick);
    },
    [dispatch, stopAnimation, totalDurationMs],
  );

  useEffect(() => {
    if (state.timerStatus !== 'running') {
      stopAnimation();
      return;
    }

    startPerfRef.current = performance.now();
    frameRef.current = requestAnimationFrame(syncTick);

    return stopAnimation;
  }, [state.timerStatus, state.currentRoundIndex, syncTick, stopAnimation]);

  useEffect(() => {
    if (state.timerStatus === 'idle') {
      accumulatedElapsedRef.current = 0;
      return;
    }

    if (state.timerStatus === 'paused' || state.timerStatus === 'ended') {
      accumulatedElapsedRef.current = currentRound?.elapsedMs ?? 0;
    }
  }, [state.timerStatus, currentRound?.elapsedMs]);

  const start = useCallback(() => {
    if (state.timerStatus === 'idle') {
      accumulatedElapsedRef.current = 0;
      dispatch({ type: 'START_ROUND' });
      return;
    }
    if (state.timerStatus === 'paused') {
      dispatch({ type: 'RESUME_ROUND' });
    }
  }, [dispatch, state.timerStatus]);

  const pause = useCallback(() => {
    if (state.timerStatus === 'running') {
      const now = performance.now();
      accumulatedElapsedRef.current += now - startPerfRef.current;
      dispatch({ type: 'PAUSE_ROUND' });
    }
  }, [dispatch, state.timerStatus]);

  const endRound = useCallback(() => {
    stopAnimation();
    const elapsedMs = currentRound?.elapsedMs ?? accumulatedElapsedRef.current;
    dispatch({ type: 'END_ROUND', elapsedMs });
  }, [currentRound?.elapsedMs, dispatch, stopAnimation]);

  return { start, pause, endRound };
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
