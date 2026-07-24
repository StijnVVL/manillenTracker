import { Injectable, OnDestroy } from '@angular/core';
import { TournamentService } from './tournament.service';
import { type TournamentState, type TournamentAction } from '../models/tournament.model';

@Injectable({
  providedIn: 'root',
})
export class TimerService implements OnDestroy {
  private intervalId: ReturnType<typeof setInterval> | null = null;

  constructor(private tournamentService: TournamentService) {}

  ngOnDestroy(): void {
    this.stopTimer();
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
  start(timeDue: number, onTick?: (timeCurrent: number) => void): void {
    this.stopTimer();
 
    // Update every 50ms for accurate second-by-second counting
    this.intervalId = setInterval(() => {
     
      var timeCurrent = new Date().getTime();

      if (timeDue - timeCurrent <= 0) {
        this.stopTimer();
      }
      
      if (onTick){
        onTick(timeCurrent);
      }
    }, 50);
  }

  /**
   * Pause the countdown timer
   */
  stop(): void {
    if (this.tournamentService.state.timerStatus === 'running' && this.intervalId !== null) {
      this.stopTimer();
    }
  }

  /**
   * Reset the time to its initial 
   */
  reset(): void {
    this.stopTimer();
  }
}

export function formatTime(secs: number): string {
  console.log(secs);
  const totalSeconds = Math.max(0, Math.floor(secs));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
