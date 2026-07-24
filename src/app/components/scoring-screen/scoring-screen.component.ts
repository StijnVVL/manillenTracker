import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentService } from '../../services/tournament.service';
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
    CommonModule,
    FormsModule,
    LadderBoardComponent,
    RoundHistoryComponent,
    RoundProgressComponent,
    TeamStandingsComponent,
  ],
  template: `
    @if (currentRound) {
      <app-round-progress [roundNumber]="currentRound.number" />

      <div class="card">
        <h2 class="card-title">Enter Scores — Round {{ currentRound.number }}</h2>
        <p style="color: var(--muted); margin-top: 0">
          Enter raw card points per team. Table movement is based on the score difference
          between the winning and losing team.
          @if (currentRound.number === TOTAL_ROUNDS) {
            This is the final round — the Table 1 winner becomes champion.
          }
        </p>

        @for (matchup of currentRound.matchups; track matchup.teamAId + matchup.teamBId; let index = $index) {
          <div class="card score-card">
            <div class="score-card-header">Table {{ index + 1 }}</div>
            <div class="score-inputs">
              <div>
                <label class="field-label" for="score-{{ matchup.teamAId }}">
                  {{ getTeamName(matchup.teamAId) }}
                </label>
                <input
                  [id]="'score-' + matchup.teamAId"
                  class="input-number"
                  type="number"
                  min="0"
                  max="61"
                  [ngModel]="scores[matchup.teamAId]"
                  (ngModelChange)="onScoreChange(matchup.teamAId, $event)"
                />
                @if (matchupDiffs(matchup)?.winnerId === matchup.teamAId) {
                  <div class="score-preview">Winner: +{{ matchupDiffs(matchup)!.margin }}</div>
                }
                @if (matchupDiffs(matchup)?.loserId === matchup.teamAId) {
                  <div class="score-preview">Loser: -{{ matchupDiffs(matchup)!.margin }}</div>
                }
              </div>
              <div>
                <label class="field-label" for="score-{{ matchup.teamBId }}">
                  {{ getTeamName(matchup.teamBId) }}
                </label>
                <input
                  [id]="'score-' + matchup.teamBId"
                  class="input-number"
                  type="number"
                  min="0"
                  max="61"
                  [ngModel]="scores[matchup.teamBId]"
                  (ngModelChange)="onScoreChange(matchup.teamBId, $event)"
                />
                @if (matchupDiffs(matchup)?.winnerId === matchup.teamBId) {
                  <div class="score-preview">Winner: +{{ matchupDiffs(matchup)!.margin }}</div>
                }
                @if (matchupDiffs(matchup)?.loserId === matchup.teamBId) {
                  <div class="score-preview">Loser: -{{ matchupDiffs(matchup)!.margin }}</div>
                }
              </div>
            </div>
            @if (matchupDiffs(matchup)) {
              <div class="score-preview">
                Score difference: {{ matchupDiffs(matchup)!.margin }} — Winner: 
                {{ getTeamName(matchupDiffs(matchup)!.winnerId) }}
              </div>
            }
            @if (!matchupDiffs(matchup) && winnerId(matchup) === null && scores[matchup.teamAId] !== undefined && scores[matchup.teamBId] !== undefined) {
              <div class="score-preview">Tie — no table movement</div>
            }
            @if (warning(matchup)) {
              <div class="score-warning">{{ warning(matchup) }}</div>
            }
          </div>
        }

        @if (currentRound.byeTeamId) {
          <p class="bye-note">
            Bye: {{ getTeamName(currentRound.byeTeamId) }} (no score entry needed)
          </p>
        }

        <div class="setup-actions">
          <button
            type="button"
            class="btn btn-primary"
            [disabled]="!allMatchupsFilled"
            (click)="confirmScores()"
          >
            Confirm Scores
          </button>
          @if (confirmed && currentRound.number < TOTAL_ROUNDS) {
            <button type="button" class="btn btn-secondary" (click)="nextRound()">
              Next Round
            </button>
          }
        </div>
      </div>

      @if (showUpdatedLadder) {
        <div class="grid-2" style="margin-top: 1rem">
          <app-ladder-board
            [teams]="state.teams"
            [ladder]="state.lastLadderSnapshot!"
            [roundDiffs]="beforeDiffs"
            title="Ladder Before"
          />
          <app-ladder-board
            [teams]="state.teams"
            [ladder]="state.ladder"
            [roundDiffs]="afterDiffs"
            title="Ladder After"
          />
        </div>
      }

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
export class ScoringScreenComponent implements OnInit {
  state: TournamentState;
  currentRound: Round | null = null;
  teamMap: Map<string, Team> = new Map();
  scores: Record<string, string> = {};
  confirmed: boolean = false;
  TOTAL_ROUNDS = TOTAL_ROUNDS;

  constructor(private tournamentService: TournamentService) {
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
