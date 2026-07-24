import { Component, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { TournamentService } from '../../services/tournament.service';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { getMatchupDiffs, getWinnerId, scoreWarning } from '../../logic/scoring';
import { TOTAL_ROUNDS } from '../../models/tournament.model';
import { getCurrentRound, getTeamMap } from '../../utils/teams';
import { LadderBoardComponent } from '../ladder-board/ladder-board.component';
import { RoundHistoryComponent } from '../round-history/round-history.component';
import { RoundProgressComponent } from '../round-progress/round-progress.component';
import { TeamStandingsComponent } from '../team-standings/team-standings.component';
import { TournamentState, Round, Matchup, Team } from '../../models/tournament.model';

@Component({
  selector: 'app-scoring-screen',
  standalone: true,
  imports: [
    FormsModule,
    LadderBoardComponent,
    RoundHistoryComponent,
    RoundProgressComponent,
    TeamStandingsComponent,
    L10nPipe
],
  templateUrl: './scoring-screen.component.html',
  styles: [],
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
    public l10n: L10nService
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
    if (!this.currentRound || this.currentRound.results.length === 0) {
      this.scores = {};
      this.confirmed = false;
      return;
    }
    this.scores = Object.fromEntries(
      this.currentRound.results.map((result) => [result.teamId, String(result.rawScore)]),
    );
    this.confirmed = this.currentRound.results.length > 0;
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
    return new Map(this.currentRound.results.map((r) => [r.teamId, r.matchDiff]));
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
    this.tournamentService.dispatch({ type: 'NEXT_ROUND' });
    this.scores = {};
    this.confirmed = false;
  }
}
