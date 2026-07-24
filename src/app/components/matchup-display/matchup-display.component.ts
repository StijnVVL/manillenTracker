import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentService } from '../../services/tournament.service';
import { getCurrentRound } from '../../utils/teams';
import { TournamentState, Round, Team } from '../../models/tournament.model';

@Component({
  selector: 'app-matchup-display',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './matchup-display.component.html',
  styleUrl: './matchup-display.component.css',
})
export class MatchupDisplayComponent implements OnInit {
  state: TournamentState;
  currentRound: Round | null = null;
  teamMap: Map<string, Team> = new Map();

  constructor(private tournamentService: TournamentService) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.tournamentService.state$.subscribe((state) => {
      this.state = state;
      this.currentRound = getCurrentRound(state);
      this.teamMap = new Map(state.teams.map(t => [t.id, t]));
    });
  }

  getTeamName(teamId: string): string {
    return this.teamMap.get(teamId)?.name ?? 'Unknown team';
  }

  startRound(): void {
    // Start the timer - the state will change to running
    // and RoundScreen will be shown automatically
    this.tournamentService.dispatch({ type: 'INIT_ROUND' });
  }
}
