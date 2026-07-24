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
  templateUrl: './finished-screen.component.html',
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
}
