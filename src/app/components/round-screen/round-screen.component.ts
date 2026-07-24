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
  templateUrl: './round-screen.component.html',
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
