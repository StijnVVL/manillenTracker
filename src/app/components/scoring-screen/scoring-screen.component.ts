import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { TournamentService } from '../../services/tournament.service';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { getMatchupDiffs, getWinnerId, scoreWarning } from '../../logic/scoring';
import { TOTAL_ROUNDS } from '../../models/tournament.model';
import { getCurrentRound, getTeamMap } from '../../utils/teams';
import { LadderBoardComponent } from '../ladder-board/ladder-board.component';
import { RoundProgressComponent } from '../round-progress/round-progress.component';
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
    LadderBoardComponent,
    RoundProgressComponent,
    L10nPipe
],
  templateUrl: './scoring-screen.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './scoring-screen.component.css',
})
export class ScoringScreenComponent implements OnInit {
  state: TournamentState;
  currentRound: Round | null = null;
  teamMap: Map<string, Team> = new Map();
  scores: Record<string, string> = {};
  confirmed: boolean = false;
  TOTAL_ROUNDS = TOTAL_ROUNDS;

  constructor(
    private tournamentService: TournamentService,
    public l10n: L10nService,
    private scoreEditDialogService: ScoreEditDialogService,
    private confirmDialogService: ConfirmDialogService
  ) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.tournamentService.state$.subscribe((state) => {
      this.state = state;
      this.currentRound = getCurrentRound(state);
      this.teamMap = getTeamMap(state.teams);
      this.initializeScores();
    });
  }

  initializeScores(): void {
    if (!this.currentRound) {
      this.scores = {};
      this.confirmed = false;
      return;
    }

    // Read scores from matchups
    const scoresFromMatchups: Record<string, string> = {};
    let hasAnyScores = false;

    for (const matchup of this.currentRound.matchups) {
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
    if (!this.currentRound) return false;
    return this.currentRound.matchups.every((matchup) => {
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

  get showUpdatedLadder(): boolean {
    return this.confirmed && this.state.lastLadderSnapshot !== null;
  }

  get beforeDiffs(): Map<string, number> {
    if (!this.currentRound) return new Map();

    // Calculate match diffs from matchup scores
    const diffs = new Map<string, number>();
    for (const matchup of this.currentRound.matchups) {
      if (matchup.teamAScore !== undefined && matchup.teamBScore !== undefined) {
        const diff = getMatchupDiffs(matchup.teamAId, matchup.teamBId, {
          [matchup.teamAId]: matchup.teamAScore,
          [matchup.teamBId]: matchup.teamBScore
        });

        if (diff) {
          diffs.set(diff.winnerId, diff.margin);
          diffs.set(diff.loserId, -diff.margin);
        } else {
          // Tie
          diffs.set(matchup.teamAId, 0);
          diffs.set(matchup.teamBId, 0);
        }
      }
    }
    return diffs;
  }

  get afterDiffs(): Map<string, number> {
    return this.beforeDiffs;
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
    if (!this.allMatchupsFilled) return;
    this.tournamentService.dispatch({ type: 'SUBMIT_SCORES', scores: this.numericScores });
    this.confirmed = true;
  }

  nextRound(): void {
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
    if (!this.currentRound) return [];
    const mid = Math.ceil(this.currentRound.matchups.length / 2);
    return this.currentRound.matchups.slice(0, mid);
  }

  get rightColumnMatchups(): Matchup[] {
    if (!this.currentRound) return [];
    const mid = Math.ceil(this.currentRound.matchups.length / 2);
    return this.currentRound.matchups.slice(mid);
  }
}
