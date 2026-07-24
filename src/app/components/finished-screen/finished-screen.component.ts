import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentService } from '../../services/tournament.service';
import { getTournamentWinner } from '../../logic/standings';
import { getTeamMap } from '../../utils/teams';
import { LadderBoardComponent } from '../ladder-board/ladder-board.component';
import { RoundHistoryComponent } from '../round-history/round-history.component';
import { TeamStandingsComponent } from '../team-standings/team-standings.component';
import { TournamentState, Team } from '../../models/tournament.model';

@Component({
  selector: 'app-finished-screen',
  standalone: true,
  imports: [
    CommonModule,
    LadderBoardComponent,
    RoundHistoryComponent,
    TeamStandingsComponent,
  ],
  template: `
    <div class="card champion-card">
      @if (championId) {
        <div class="champion-label">Champion</div>
        <div class="champion-name">{{ getTeamName(championId) }}</div>
        <p class="champion-note">
          Winner of Table 1 in the final round
        </p>
      } @else {
        <div class="champion-label">Tournament Complete</div>
        <div class="champion-name">No champion</div>
        <p class="champion-note">
          Table 1 in the final round ended in a tie
        </p>
      }
    </div>

    <div class="grid-2" style="margin-top: 1rem">
      <app-ladder-board [teams]="state.teams" [ladder]="state.ladder" title="Final Ladder" />
      <app-team-standings [state]="state" title="Final Standings" />
    </div>

    <div style="margin-top: 1rem">
      <app-round-history
        [rounds]="state.rounds"
        [teams]="state.teams"
        [currentRoundIndex]="state.currentRoundIndex"
      />
    </div>

    <div class="setup-actions" style="margin-top: 1rem">
      <button
        type="button"
        class="btn btn-primary"
        (click)="startNewTournament()"
      >
        Start New Tournament
      </button>
    </div>
  `,
  styles: [],
})
export class FinishedScreenComponent implements OnInit {
  state: TournamentState;
  teamMap: Map<string, Team> = new Map();
  championId: string | null = null;

  constructor(private tournamentService: TournamentService) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.tournamentService.state$.subscribe((state) => {
      this.state = state;
      this.teamMap = getTeamMap(state.teams);
      this.championId = getTournamentWinner(state);
    });
  }

  getTeamName(teamId: string): string {
    return this.teamMap.get(teamId)?.name ?? 'Unknown team';
  }

  startNewTournament(): void {
    this.tournamentService.clearPersistedState();
    this.tournamentService.dispatch({ type: 'RESET_TOURNAMENT' });
  }
}
