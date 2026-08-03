import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { TimerService, formatTime } from '../../services/timer.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { getRoundByNumber, getLatestRoundDiffs, getCurrentRound, isRoundInFuture, isPageInFuture } from '../../utils/teams';
import { CountdownTimerComponent } from '../countdown-timer/countdown-timer.component';
import { RoundHistoryComponent } from '../round-history/round-history.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { TournamentState, Round, TournamentAction, Team, Matchup } from '../../models/tournament.model';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { L10nService } from '../../services/l10n.service';

@Component({
  selector: 'app-round-screen',
  standalone: true,
  imports: [
    CountdownTimerComponent,
    RoundHistoryComponent,
    BreadcrumbComponent,
    L10nPipe
],
  templateUrl: './round-screen.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './round-screen.component.css',
})
export class RoundScreenComponent implements OnInit, OnDestroy {
  state: TournamentState;
  currentRound: Round | null = null;
  displayRound: Round | null = null;
  roundNumber: number = 1;
  roundDiffs: Map<string, number> = new Map();
  remainingSeconds: number | null = null;
  teamMap: Map<string, Team> = new Map();
  isFutureRound: boolean = false;
  isFuturePage: boolean = false;

  constructor(
    private tournamentService: TournamentService,
    private confirmDialogService: ConfirmDialogService,
    private timerService: TimerService,
    private l10n: L10nService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.roundNumber = +params['roundNumber'];
      this.checkIfFutureRound();
      this.loadRound();
    });

    this.tournamentService.state$.subscribe((state) => {
      this.state = state;
      this.currentRound = getCurrentRound(state);
      this.checkIfFutureRound();
      this.loadRound();
      this.roundDiffs = getLatestRoundDiffs(state);
      this.teamMap = new Map(state.teams.map(t => [t.id, t]));
    });
  }

  checkIfFutureRound(): void {
    this.isFutureRound = isRoundInFuture(this.state, this.roundNumber);
    this.isFuturePage = isPageInFuture(this.state, this.roundNumber, 'play');
  }

  goToCurrentRound(): void {
    if (this.currentRound) {
      this.router.navigate(['/tournament/round', this.currentRound.number, 'play']);
    }
  }

  loadRound(): void {
    this.displayRound = getRoundByNumber(this.state, this.roundNumber);
  }

  get isCurrentRound(): boolean {
    return this.currentRound?.number === this.displayRound?.number;
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
    var dueTimeMs = nowTimeMs + this.state.roundDurationSeconds * 1000;
   
    this.remainingSeconds = (dueTimeMs - nowTimeMs) / 1000;
    this.tournamentService.dispatch({ type: 'START_ROUND', dueTime: dueTimeMs } as TournamentAction);
    this.timerService.start(dueTimeMs, (timeCurrent) => this.onTick(timeCurrent));
  }

  onTick(timeCurrent: number): void {
    this.remainingSeconds = (this.currentRound?.dueAt! - timeCurrent) / 1000;
    this.tournamentService.dispatch({
      type: 'TICK_TIMER',
      currentTime: timeCurrent
    } as TournamentAction);

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
    var round = this.state.rounds[this.state.rounds.length - 1];

    var confirmed = true;
    if (Date.now() < round.dueAt!) {
      confirmed = await this.confirmDialogService.confirm({
        title: this.l10n.get('dialog.endRound.title'),
        message: this.l10n.get('dialog.endRound.message'),
        confirmText: this.l10n.get('dialog.endRound.confirm'),
        cancelText: this.l10n.get('common.cancel')
      });
    }
    
    if (confirmed) {
      this.#endRound();
    }
  }

  getTeamName(teamId: string): string {
    return this.teamMap.get(teamId)?.name ?? 'Unknown team';
  }

  get leftColumnMatchups(): Matchup[] {
    if (!this.displayRound) return [];
    const mid = Math.ceil(this.displayRound.matchups.length / 2);
    return this.displayRound.matchups.slice(0, mid);
  }

  get rightColumnMatchups(): Matchup[] {
    if (!this.displayRound) return [];
    const mid = Math.ceil(this.displayRound.matchups.length / 2);
    return this.displayRound.matchups.slice(mid);
  }
}
