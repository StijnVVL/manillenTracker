import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentService } from '../../services/tournament.service';
import { TimerService, formatTime } from '../../services/timer.service';
import { getCurrentRound, getLatestRoundDiffs } from '../../utils/teams';
import { CountdownTimerComponent } from '../countdown-timer/countdown-timer.component';
import { LadderBoardComponent } from '../ladder-board/ladder-board.component';
import { MatchupListComponent } from '../matchup-list/matchup-list.component';
import { RoundHistoryComponent } from '../round-history/round-history.component';
import { TeamStandingsComponent } from '../team-standings/team-standings.component';
import { TournamentState, Round } from '../../models/tournament.model';

@Component({
  selector: 'app-round-screen',
  standalone: true,
  imports: [
    CommonModule,
    CountdownTimerComponent,
    LadderBoardComponent,
    MatchupListComponent,
    RoundHistoryComponent,
    TeamStandingsComponent,
  ],
  template: `
    @if (currentRound) {
      <app-countdown-timer
        [remainingMs]="state.remainingMs"
        [roundNumber]="currentRound.number"
        [isWarning]="isWarning"
      />

      <div class="timer-controls">
        @if (isIdle || isPaused) {
          <button type="button" class="btn btn-primary" (click)="startTimer()">
            {{ isPaused ? 'Resume' : 'Start Round' }}
          </button>
        }
        @if (isRunning) {
          <button type="button" class="btn btn-secondary" (click)="pauseTimer()">
            Pause
          </button>
        }
        <button
          type="button"
          class="btn btn-danger"
          (click)="endRound()"
          [disabled]="state.timerStatus === 'ended'"
        >
          End Round
        </button>
      </div>

      <div class="grid-2" style="margin-top: 1.5rem">
        <app-ladder-board
          [teams]="state.teams"
          [ladder]="state.ladder"
          [roundDiffs]="roundDiffs"
        />
        <app-matchup-list [round]="currentRound" [teams]="state.teams" />
      </div>

      <div style="margin-top: 1rem">
        <app-team-standings [state]="state" />
      </div>

      <div style="margin-top: 1rem">
        <app-round-history
          [rounds]="state.rounds"
          [teams]="state.teams"
          [currentRoundIndex]="state.currentRoundIndex"
        />
      </div>
    }
  `,
  styles: [],
})
export class RoundScreenComponent implements OnInit, OnDestroy {
  state: TournamentState;
  currentRound: Round | null = null;
  roundDiffs: Map<string, number> = new Map();

  constructor(
    private tournamentService: TournamentService,
    private timerService: TimerService,
  ) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.tournamentService.state$.subscribe((state) => {
      this.state = state;
      this.currentRound = getCurrentRound(state);
      this.roundDiffs = getLatestRoundDiffs(state);
    });
  }

  ngOnDestroy(): void {
    this.timerService.ngOnDestroy();
  }

  get isRunning(): boolean {
    return this.state.timerStatus === 'running';
  }

  get isPaused(): boolean {
    return this.state.timerStatus === 'paused';
  }

  get isIdle(): boolean {
    return this.state.timerStatus === 'idle';
  }

  get isWarning(): boolean {
    return this.state.remainingMs <= 5 * 60 * 1000 && this.state.remainingMs > 0;
  }

  startTimer(): void {
    this.timerService.start(() => this.playTimeUpBeep());
  }

  pauseTimer(): void {
    this.timerService.pause();
  }

  endRound(): void {
    this.timerService.endRound();
  }

  private playTimeUpBeep(): void {
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
}
