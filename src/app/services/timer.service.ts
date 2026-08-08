import { Injectable, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TournamentService } from './tournament.service';
import { type TournamentAction } from '../models/tournament.model';

@Injectable({
  providedIn: 'root',
})
export class TimerService implements OnDestroy {
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private tickCallback: ((timeCurrent: number) => void) | null = null;
  private stateSub: Subscription;

  constructor(private tournamentService: TournamentService) {
    // Self-bootstrap: whenever state says 'running' and we have no interval, start one.
    // This covers direct URL navigation, page refresh, and RESTORE_STATE.
    this.stateSub = this.tournamentService.state$.subscribe(state => {
      if (state.timerStatus === 'running' && this.intervalId === null) {
        const dueAt = state.rounds?.at(-1)?.dueAt;
        if (dueAt) {
          this.startInterval(dueAt);
        }
      } else if (state.timerStatus !== 'running' && this.intervalId !== null) {
        // Round paused, ended, or stopped — kill the interval
        this.stopTimer();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopTimer();
    this.stateSub.unsubscribe();
  }

  private stopTimer(): void {
    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private startInterval(timeDue: number): void {
    this.stopTimer();
    this.intervalId = setInterval(() => {
      const timeCurrent = Date.now();

      if (timeDue - timeCurrent <= 0) {
        this.stopTimer();
        if (this.tournamentService.state.timerStatus === 'running') {
          this.tournamentService.dispatch({ type: 'END_ROUND', endTime: timeCurrent } as TournamentAction);
        }
      }

      this.tickCallback?.(timeCurrent);
    }, 50);
  }

  /**
   * Register a visual tick callback (called by the component while visible).
   * Does not affect the running interval.
   */
  setTickCallback(cb: (timeCurrent: number) => void): void {
    this.tickCallback = cb;
  }

  /**
   * Unregister the visual tick callback (called on component destroy).
   * Does not affect the running interval.
   */
  clearTickCallback(): void {
    this.tickCallback = null;
  }

  /**
   * Pause the countdown timer.
   */
  stop(): void {
    if (this.tournamentService.state.timerStatus === 'running' && this.intervalId !== null) {
      this.stopTimer();
    }
  }

  /**
   * Reset the timer (clears interval, does not dispatch state).
   */
  reset(): void {
    this.stopTimer();
  }
}

export function getTimerColor(remainingSeconds: number | null, staticDurationSeconds: number | null, isEnded: boolean): string {
  if (isEnded) return '#e53935';
  if (remainingSeconds === null || staticDurationSeconds === null || staticDurationSeconds <= 0) {
    return '#2e7d32'; // green when idle/static
  }
  // ratio 1 = full time left (green), 0 = no time left (red)
  const ratio = Math.min(1, Math.max(0, remainingSeconds / staticDurationSeconds));
  // green #2e7d32 (46,125,50) -> orange #e65100 (230,81,0) -> red #c62828 (198,40,40)
  let r: number, g: number, b: number;
  if (ratio >= 0.5) {
    const t = (1 - ratio) * 2;
    r = Math.round(46  + t * (230 - 46));
    g = Math.round(125 + t * (81  - 125));
    b = Math.round(50  + t * (0   - 50));
  } else {
    const t = (0.5 - ratio) * 2;
    r = Math.round(230 + t * (198 - 230));
    g = Math.round(81  + t * (40  - 81));
    b = Math.round(0   + t * (40  - 0));
  }
  return `rgb(${r},${g},${b})`;
}

export function formatTime(secs: number): string {
  // Ceil so 24.01 shows 25, 0.x shows 1 — but 0 stays 0
  const totalSeconds = secs <= 0 ? 0 : Math.ceil(secs);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
