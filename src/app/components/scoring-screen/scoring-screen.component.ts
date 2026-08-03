import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TournamentService } from '../../services/tournament.service';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { getMatchupDiffs, getWinnerId, scoreWarning } from '../../logic/scoring';
import { getRoundByNumber, getCurrentRound, getTeamMap, isRoundInFuture, isPageInFuture } from '../../utils/teams';
import { RoundProgressComponent } from '../round-progress/round-progress.component';
import { BreadcrumbComponent } from '../breadcrumb/breadcrumb.component';
import { TournamentState, Round, Matchup, Team } from '../../models/tournament.model';
import { ScoreEditDialogService } from '../../services/score-edit-dialog.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-scoring-screen',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    RoundProgressComponent,
    BreadcrumbComponent,
    L10nPipe
],
  templateUrl: './scoring-screen.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './scoring-screen.component.css',
})
export class ScoringScreenComponent implements OnInit {
  state: TournamentState;
  currentRound: Round | null = null;
  displayRound: Round | null = null;
  roundNumber: number = 1;
  teamMap: Map<string, Team> = new Map();
  scores: Record<string, string> = {};
  confirmed: boolean = false;
  isFutureRound: boolean = false;
  isFuturePage: boolean = false;

  constructor(
    private tournamentService: TournamentService,
    public l10n: L10nService,
    private scoreEditDialogService: ScoreEditDialogService,
    private confirmDialogService: ConfirmDialogService,
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
      this.teamMap = getTeamMap(state.teams);
      this.initializeScores();
    });
  }

  checkIfFutureRound(): void {
    this.isFutureRound = isRoundInFuture(this.state, this.roundNumber);
    this.isFuturePage = isPageInFuture(this.state, this.roundNumber, 'scoring');
  }

  goToCurrentRound(): void {
    if (this.currentRound) {
      this.router.navigate(['/round', this.currentRound.number, 'scoring']);
    }
  }

  loadRound(): void {
    this.displayRound = getRoundByNumber(this.state, this.roundNumber);
  }

  get isCurrentRound(): boolean {
    return this.currentRound?.number === this.displayRound?.number;
  }

  get scoresAlreadyConfirmed(): boolean {
    // Scores are confirmed if:
    // 1. Viewing a past round (not current), OR
    // 2. Current round but status has moved beyond 'scoring'
    return !this.isCurrentRound || (this.state.status !== 'round' && this.state.status !== 'scoring');
  }

  initializeScores(): void {
    if (!this.displayRound) {
      this.scores = {};
      this.confirmed = false;
      return;
    }

    // Read scores from matchups
    const scoresFromMatchups: Record<string, string> = {};
    let hasAnyScores = false;

    for (const matchup of this.displayRound.matchups) {
      if (matchup.teamAScore !== undefined) {
        scoresFromMatchups[matchup.teamAId] = String(matchup.teamAScore);
        hasAnyScores = true;
      }
      if (matchup.teamBScore !== undefined) {
        scoresFromMatchups[matchup.teamBId] = String(matchup.teamBScore);
        hasAnyScores = true;
      }
    }

    this.scores = scoresFromMatchups;
    this.confirmed = hasAnyScores && this.allMatchupsFilled;
  }

  onScoreChange(teamId: string, value: string): void {
    this.scores[teamId] = value;
    this.confirmed = false;
  }

  getTeamName(teamId: string): string {
    return this.teamMap.get(teamId)?.name ?? 'Unknown team';
  }

  get allMatchupsFilled(): boolean {
    if (!this.displayRound) return false;
    return this.displayRound.matchups.every((matchup) => {
      const scoreA = this.numericScores[matchup.teamAId];
      const scoreB = this.numericScores[matchup.teamBId];
      return scoreA !== undefined && scoreB !== undefined;
    });
  }

  get numericScores(): Record<string, number> {
    const parsed: Record<string, number> = {};
    for (const [teamId, value] of Object.entries(this.scores)) {
      const num = Number(value);
      if (!Number.isNaN(num)) parsed[teamId] = num;
    }
    return parsed;
  }

  matchupDiffs(matchup: Matchup) {
    return getMatchupDiffs(matchup.teamAId, matchup.teamBId, this.numericScores);
  }

  winnerId(matchup: Matchup): string | null {
    return getWinnerId(matchup.teamAId, matchup.teamBId, this.numericScores);
  }

  warning(matchup: Matchup): string | null {
    const scoreA = this.numericScores[matchup.teamAId];
    const scoreB = this.numericScores[matchup.teamBId];
    if (scoreA === undefined || scoreB === undefined) return null;
    return scoreWarning(scoreA, scoreB);
  }

  confirmScores(): void {
    if (!this.displayRound) return;

    // If scores already confirmed, just navigate to round winner screen
    if (this.scoresAlreadyConfirmed) {
      this.router.navigate(['/round', this.displayRound.number, 'round-winner']);
      return;
    }

    // Otherwise, confirm scores normally (only for current round in 'scoring' status)
    if (!this.allMatchupsFilled || !this.isCurrentRound) return;
    this.tournamentService.dispatch({ type: 'SUBMIT_SCORES', scores: this.numericScores });
    this.confirmed = true;
  }

  nextRound(): void {
    if (!this.isCurrentRound || !this.displayRound) return;

    this.confirmDialogService.confirm({
      title: this.l10n.get('dialog.nextRound.title'),
      message: this.l10n.get('dialog.nextRound.message'),
      confirmText: this.l10n.get('dialog.nextRound.confirm')
    }).then((confirmed) => {
      if (confirmed) {
        this.tournamentService.dispatch({ type: 'NEXT_ROUND' });
        this.scores = {};
        this.confirmed = false;
      }
    });
  }

  async editMatchScore(matchup: Matchup): Promise<void> {
    const scoreA = this.numericScores[matchup.teamAId];
    const scoreB = this.numericScores[matchup.teamBId];

    const result = await this.scoreEditDialogService.open({
      teamAId: matchup.teamAId,
      teamBId: matchup.teamBId,
      teamAName: this.getTeamName(matchup.teamAId),
      teamBName: this.getTeamName(matchup.teamBId),
      scoreA,
      scoreB
    });

    if (result) {
      this.scores[matchup.teamAId] = String(result.scoreA);
      this.scores[matchup.teamBId] = String(result.scoreB);
      this.confirmed = false;

      // Persist scores immediately without confirming/updating ladder
      this.tournamentService.dispatch({ 
        type: 'UPDATE_SCORES', 
        scores: this.numericScores 
      });
    }
  }

  hasScores(matchup: Matchup): boolean {
    return this.numericScores[matchup.teamAId] !== undefined &&
           this.numericScores[matchup.teamBId] !== undefined;
  }

  getMatchupScoreDisplay(matchup: Matchup): string {
    const scoreA = this.numericScores[matchup.teamAId];
    const scoreB = this.numericScores[matchup.teamBId];
    if (scoreA !== undefined && scoreB !== undefined) {
      return `${scoreA} - ${scoreB}`;
    }
    return '—';
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
