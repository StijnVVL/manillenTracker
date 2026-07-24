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
  template: `
    <div class="card">
      <h2 class="card-title">{{ title }}</h2>
      <div class="standings-table-wrap">
        <table class="standings-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th>W</th>
              <th>L</th>
              <th>T</th>
              <th>Margin</th>
            </tr>
          </thead>
          <tbody>
            @for (standing of standings; track standing.teamId) {
              <tr>
                <td>{{ standing.currentRank }}</td>
                <td>{{ getTeamName(standing.teamId) }}</td>
                <td>{{ standing.wins }}</td>
                <td>{{ standing.losses }}</td>
                <td>{{ standing.ties }}</td>
                <td>{{ standing.totalMarginWon }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>
  `,
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
