import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentState, Team } from '../../models/tournament.model';
import { computeStandings } from '../../logic/standings';
import { getTeamMap } from '../../utils/teams';
import { TeamStanding } from '../../logic/standings';

@Component({
  selector: 'app-team-standings',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './team-standings.component.html',
  styles: [],
})
export class TeamStandingsComponent implements OnChanges {
  @Input() state: TournamentState | null = null;
  @Input() title: string = 'Team Standings';

  teamMap: Map<string, Team> = new Map();
  standings: TeamStanding[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (this.state) {
      this.teamMap = getTeamMap(this.state.teams);
      this.standings = computeStandings(this.state);
    }
  }

  getTeamName(teamId: string): string {
    return this.teamMap.get(teamId)?.name ?? 'Unknown team';
  }
}
