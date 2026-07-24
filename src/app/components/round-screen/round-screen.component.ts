import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

import { TournamentService } from '../../services/tournament.service';
import { TimerService, formatTime } from '../../services/timer.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { getCurrentRound, getLatestRoundDiffs } from '../../utils/teams';
import { CountdownTimerComponent } from '../countdown-timer/countdown-timer.component';
import { LadderBoardComponent } from '../ladder-board/ladder-board.component';
import { MatchupListComponent } from '../matchup-list/matchup-list.component';
import { RoundHistoryComponent } from '../round-history/round-history.component';
import { TeamStandingsComponent } from '../team-standings/team-standings.component';
import { TournamentState, Round, TournamentAction } from '../../models/tournament.model';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { L10nService } from '../../services/l10n.service';

@Component({
  selector: 'app-round-screen',
  standalone: true,
  imports: [
    CountdownTimerComponent,
    LadderBoardComponent,
    MatchupListComponent,
    RoundHistoryComponent,
    TeamStandingsComponent,
    L10nPipe
],
  templateUrl: './round-screen.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [],
})
export class RoundScreenComponent implements OnInit, OnDestroy {
  state: TournamentState;
  currentRound: Round | null = null;
  roundDiffs: Map<string, number> = new Map();
  remainingSeconds: number | null = null;

  constructor(
    private tournamentService: TournamentService,
    private confirmDialogService: ConfirmDialogService,
    private timerService: TimerService,
    private l10n: L10nService
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
    if (!this.currentRound?.dueAt) {
      return false;
    }

    var nowTime = new Date().getTime();
    var leftTimeMs = this.currentRound.dueAt - nowTime;
    var thresholdMs = 5 * 60 * 1000;
    return leftTimeMs < thresholdMs;
  }

  startRound(): void {
    var nowDate = new Date();
    var nowTimeMs = nowDate.getTime()
    var dueTimeMs = nowTimeMs + this.state.roundDurationMinutes * 60 * 1000;
   
    this.remainingSeconds = (dueTimeMs - nowTimeMs) / 1000;
    this.tournamentService.dispatch({ type: 'START_ROUND', dueTime: dueTimeMs } as TournamentAction);
    this.timerService.start(dueTimeMs, (timeCurrent) => this.onTick(timeCurrent));
  }

  onTick(timeCurrent: number): void {
    console.log(timeCurrent);
    this.remainingSeconds = (this.currentRound?.dueAt! - timeCurrent) / 1000;
    this.tournamentService.dispatch({
      type: 'TICK_TIMER',
      currentTime: timeCurrent
    } as TournamentAction);

    if (timeCurrent >= this.currentRound?.dueAt!){
      this.endRound();
    }
    
  }

  resumeRound(): void {
    if (!this.currentRound?.dueAt){
      return;
    }
    this.tournamentService.dispatch({ type: 'RESUME_ROUND' } as TournamentAction);
    this.timerService.start(this.currentRound.dueAt, (currentTime) => this.onTick(currentTime));    
  }

  pauseRound(): void {
    this.timerService.stop();
    this.tournamentService.dispatch({ type: 'PAUSE_ROUND' } as TournamentAction);
  }

  #endRound(): void {
    var nowDate = new Date();
    var nowTime = nowDate.getTime()
    this.timerService.reset();
    this.tournamentService.dispatch({ type: 'END_ROUND', endTime: nowTime } as TournamentAction);
  }

  async endRound(): Promise<void> {
    const confirmed = await this.confirmDialogService.confirm({
      title: this.l10n.get('dialog.endRound.title'),
      message: this.l10n.get('dialog.endRound.message'),
      confirmText: this.l10n.get('dialog.endRound.confirm'),
      cancelText: this.l10n.get('common.cancel')
    });

    if (confirmed) {
      this.#endRound();
    }
  }
}
