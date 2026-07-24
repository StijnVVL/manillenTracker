import { Injectable, OnDestroy } from '@angular/core';
import { TournamentService } from './tournament.service';
import { type TournamentState, type TournamentAction } from '../models/tournament.model';

@Injectable({
  providedIn: 'root',
})
export class TimerService implements OnDestroy {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private timeUpCallback: (() => void) | null = null;

  constructor(private tournamentService: TournamentService) {}

  ngOnDestroy(): void {
    this.stopTimer();
  }

  private get state(): TournamentState {
    return this.tournamentService.state;
  }

  private get durationMs(): number {
    return this.state.roundDurationMinutes * 60 * 1000;
  }

  private stopTimer(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  /**
   * Start the countdown timer - updates every 1000ms for accurate seconds
   */
  start(onTimeUp?: () => void): void {
    this.stopTimer();
    this.timeUpCallback = onTimeUp ?? null;

    let remainingMs = this.state.remainingMs;
    
    if (this.state.timerStatus === 'idle') {
      remainingMs = this.durationMs;
      this.tournamentService.dispatch({ type: 'START_ROUND' } as TournamentAction);
    } else if (this.state.timerStatus === 'paused') {
      this.tournamentService.dispatch({ type: 'RESUME_ROUND' } as TournamentAction);
    }

    // Update every 1000ms for accurate second-by-second counting
    this.intervalId = setInterval(() => {
      remainingMs = Math.max(0, remainingMs - 1000);
      
      this.tournamentService.dispatch({
        type: 'TICK_TIMER',
        remainingMs,
        elapsedMs: 0, // Elapsed time removed - not needed
      } as TournamentAction);

      if (remainingMs <= 0) {
        this.stopTimer();
        this.tournamentService.dispatch({
          type: 'END_ROUND',
          elapsedMs: this.durationMs,
        } as TournamentAction);
        this.timeUpCallback?.();
      }
    }, 1000);
  }

  /**
   * Pause the countdown timer
   */
  pause(): void {
    if (this.state.timerStatus === 'running' && this.intervalId !== null) {
      this.stopTimer();
      this.tournamentService.dispatch({ type: 'PAUSE_ROUND' } as TournamentAction);
    }
  }

  /**
   * End the round manually
   */
  endRound(): void {
    this.stopTimer();
    this.tournamentService.dispatch({ type: 'END_ROUND', elapsedMs: this.durationMs } as TournamentAction);
  }
}

export function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
