import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { TimerService, formatTime } from '../../services/timer.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { getRoundByNumber, getLatestRoundDiffs, getCurrentRound, getTeamMap, isRoundInFuture, isPageInFuture } from '../../utils/teams';
import { CountdownTimerComponent } from '../countdown-timer/countdown-timer.component';
import { TournamentState, Round, TournamentAction, Team, Matchup, LadderSnapshotEntry } from '../../models/tournament.model';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { L10nService } from '../../services/l10n.service';
import { ScoreEditDialogService } from '../../services/score-edit-dialog.service';
import { SvgIconComponent } from '../svg-icon/svg-icon.component';
import { buildRoundResults } from '../../logic/scoring';
import { getAlgorithmById } from '../../logic/matchup-algorithm';

@Component({
  selector: 'app-round-screen',
  standalone: true,
  imports: [
    CountdownTimerComponent,
    L10nPipe,
    SvgIconComponent
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

  scores: Record<string, number> = {};

  tooltipTeamId: string | null = null;
  tooltipX: number = 0;
  tooltipY: number = 0;

  constructor(
    private tournamentService: TournamentService,
    private confirmDialogService: ConfirmDialogService,
    private scoreEditDialogService: ScoreEditDialogService,
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
      this.loadScores();
    });

    this.tournamentService.state$.subscribe((state) => {
      this.state = state;
      this.currentRound = getCurrentRound(state);
      this.checkIfFutureRound();
      this.loadRound();
      this.roundDiffs = getLatestRoundDiffs(state);
      this.teamMap = new Map(state.teams.map(t => [t.id, t]));
      this.loadScores();
    });

    // Restore timer display and interval when navigating back to a running/paused round
    const round = getCurrentRound(this.state);
    if (round?.dueAt) {
      if (this.state.timerStatus === 'running') {
        this.remainingSeconds = (round.dueAt - Date.now()) / 1000;
        if (this.remainingSeconds > 0) {
          this.timerService.start(round.dueAt, (timeCurrent) => this.onTick(timeCurrent));
        } else {
          this.remainingSeconds = 0;
          this.#endRound();
        }
      } else if (this.state.timerStatus === 'paused' && round.pausedAt) {
        this.remainingSeconds = (round.dueAt - round.pausedAt) / 1000;
      }
    }
  }

  checkIfFutureRound(): void {
    this.isFutureRound = isRoundInFuture(this.state, this.roundNumber);
    this.isFuturePage = isPageInFuture(this.state, this.roundNumber, 'play');
  }

  goToCurrentRound(): void {
    if (this.currentRound) {
      const sub = this.state.status === 'round-winner' ? 'round-winner' : 'play';
      this.router.navigate(['/tournament/round', this.currentRound.number, sub]);
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

  get isRoundEnded(): boolean {
    return this.displayRound?.endedAt !== null && this.displayRound?.endedAt !== undefined;
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

    if (this.remainingSeconds <= 0) {
      this.remainingSeconds = 0;
      this.#endRound();
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

  goToRoundWinner(): void {
    this.router.navigate(['/tournament/round', this.roundNumber, 'round-winner']);
  }

  get scoresConfirmed(): boolean {
    return this.state.status === 'round-winner' || this.state.status === 'finished';
  }

  confirmScores(): void {
    if (!this.isRoundEnded || !this.allScoresFilled) return;
    this.tournamentService.dispatch({ type: 'SUBMIT_SCORES', scores: this.scores });
  }

  loadScores(): void {
    if (!this.displayRound) return;
    const loaded: Record<string, number> = {};
    for (const m of this.displayRound.matchups) {
      if (typeof m.teamAScore === 'number' && !Number.isNaN(m.teamAScore) && m.teamAScore >= 0)
        loaded[m.teamAId] = m.teamAScore;
      if (typeof m.teamBScore === 'number' && !Number.isNaN(m.teamBScore) && m.teamBScore >= 0)
        loaded[m.teamBId] = m.teamBScore;
    }
    this.scores = loaded;
  }

  hasScore(matchup: Matchup): boolean {
    const a = this.scores[matchup.teamAId];
    const b = this.scores[matchup.teamBId];
    return typeof a === 'number' && !Number.isNaN(a) && a >= 0 &&
           typeof b === 'number' && !Number.isNaN(b) && b >= 0;
  }

  get allScoresFilled(): boolean {
    if (!this.displayRound) return false;
    return this.displayRound.matchups.every(m => this.hasScore(m));
  }

  getScoreDisplay(matchup: Matchup): string {
    const a = this.scores[matchup.teamAId];
    const b = this.scores[matchup.teamBId];
    if (a !== undefined && b !== undefined) return `${a} - ${b}`;
    return '';
  }

  getScoreA(matchup: Matchup): string {
    const a = this.scores[matchup.teamAId];
    return a !== undefined ? String(a) : '';
  }

  getScoreB(matchup: Matchup): string {
    const b = this.scores[matchup.teamBId];
    return b !== undefined ? String(b) : '';
  }

  async editMatchScore(matchup: Matchup): Promise<void> {
    const result = await this.scoreEditDialogService.open({
      teamAId: matchup.teamAId,
      teamBId: matchup.teamBId,
      teamAName: this.getTeamName(matchup.teamAId),
      teamBName: this.getTeamName(matchup.teamBId),
      scoreA: this.scores[matchup.teamAId],
      scoreB: this.scores[matchup.teamBId]
    });
    if (result) {
      const a = result.scoreA;
      const b = result.scoreB;
      const valid = a !== null && a !== undefined && !Number.isNaN(a) && a >= 0 &&
                    b !== null && b !== undefined && !Number.isNaN(b) && b >= 0;
      const updated = { ...this.scores };
      if (valid) {
        updated[matchup.teamAId] = a;
        updated[matchup.teamBId] = b;
      } else {
        delete updated[matchup.teamAId];
        delete updated[matchup.teamBId];
      }
      this.scores = updated;
      this.tournamentService.dispatch({ type: 'UPDATE_SCORES', scores: this.scores });
    }
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

  showTooltip(event: MouseEvent, teamId: string): void {
    this.tooltipTeamId = teamId;
    this.updateTooltipPosition(event);
  }

  updateTooltipPosition(event: MouseEvent): void {
    this.tooltipX = event.clientX + 14;
    this.tooltipY = event.clientY + 14;
  }

  hideTooltip(): void {
    this.tooltipTeamId = null;
  }

  getTeamStats(teamId: string): LadderSnapshotEntry | null {
    // Use the snapshot of the displayed round (the ranking that produced its matchups)
    const snap = this.displayRound?.ladderSnapshot?.find(e => e.teamId === teamId);
    return snap ?? null;
  }

  getLadderRank(teamId: string): number {
    // Rank = 1-based index in the displayed round's ladderSnapshot
    const snapshot = this.displayRound?.ladderSnapshot;
    if (snapshot) {
      const idx = snapshot.findIndex(e => e.teamId === teamId);
      if (idx >= 0) return idx + 1;
    }
    // Fall back to live ladder order if no snapshot exists yet
    return this.state.ladder.indexOf(teamId) + 1;
  }

  getRankHistory(teamId: string): number[] {
    const history: number[] = [];
    const currentRound = this.displayRound?.number ?? 0;
    for (const round of this.state.rounds) {
      if (round.number >= currentRound) break;
      const snapshot = round.ladderSnapshot;
      if (!snapshot || snapshot.length === 0) continue;
      const idx = snapshot.findIndex(e => e.teamId === teamId);
      if (idx >= 0) history.push(idx + 1);
    }
    return history;
  }

  getRoundScores(teamId: string): number[] {
    const scores: number[] = [];
    const currentRound = this.displayRound?.number ?? 0;
    for (const round of this.state.rounds) {
      if (round.number >= currentRound) break;
      // Check matchups
      for (const m of round.matchups) {
        if (m.teamAId === teamId && m.teamAScore != null) { scores.push(m.teamAScore); break; }
        if (m.teamBId === teamId && m.teamBScore != null) { scores.push(m.teamBScore); break; }
      }
      // Check excluded team
      if (round.excludedTeamId === teamId && round.excludedTeamScore != null) {
        scores.push(round.excludedTeamScore);
      }
    }
    return scores;
  }

  getTeamName(teamId: string): string {
    return this.teamMap.get(teamId)?.name ?? 'Unknown team';
  }

  getTeamNameShort(teamId: string): string {
    const name = this.getTeamName(teamId);
    if (name.length <= 45) return name;
    const cut = name.substring(0, 45);
    const lastSpace = cut.lastIndexOf(' ');
    return (lastSpace > 0 ? cut.substring(0, lastSpace) : cut) + '\u2026';
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

  get excludedTeamScore(): number {
    if (!this.displayRound?.excludedTeamId) return 0;
    if (this.displayRound.excludedTeamScore !== null && this.displayRound.excludedTeamScore !== undefined) {
      return this.displayRound.excludedTeamScore;
    }
    const results = buildRoundResults(this.displayRound.matchups, this.scores);
    if (results.length === 0) return 0;
    const algorithm = getAlgorithmById(this.state.matchupAlgorithmId);
    return algorithm.calculateExcludedScore(results);
  }

  get excludedRowRightLabel(): string { return '–'; }

  getTeamTooltip(teamId: string): string {
    const snapshot = this.displayRound?.ladderSnapshot;
    if (!snapshot || snapshot.length === 0) return '';
    const rank = snapshot.findIndex(e => e.teamId === teamId) + 1;
    if (rank === 0) return '';
    const entry = snapshot[rank - 1];
    const exclusionPart = entry.exclusions > 0 ? ` (of which ${entry.exclusions} exclusion${entry.exclusions > 1 ? 's' : ''})` : '';
    const scoreList = entry.roundScores.length > 0 ? ` [${entry.roundScores.join(', ')}]` : '';
    return `Ranked ${rank}: ${entry.wins} win${entry.wins !== 1 ? 's' : ''}${exclusionPart}, cumulative score ${entry.cumulativeScore}${scoreList}`;
  }
}
