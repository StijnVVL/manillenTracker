import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Round, Team } from '../../models/tournament.model';
import { getTeamMap } from '../../utils/teams';

@Component({
  selector: 'app-matchup-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="card">
      <h2 class="card-title">This Round's Matchups</h2>
      @if (round && round.matchups.length === 0) {
        <p class="empty-state">No matchups scheduled.</p>
      } @else if (round) {
        <ul class="matchup-list">
          @for (matchup of round.matchups; track matchup.teamAId + matchup.teamBId; let index = $index) {
            <li class="matchup-item">
              <span class="matchup-teams">
                Table {{ index + 1 }}: {{ getTeamName(matchup.teamAId) }} vs 
                {{ getTeamName(matchup.teamBId) }}
              </span>
            </li>
          }
        </ul>
      }
      @if (round && round.byeTeamId) {
        <p class="bye-note">
          Bye this round: {{ getTeamName(round.byeTeamId) }}
        </p>
      }
    </div>
  `,
  styles: [],
})
export class MatchupListComponent implements OnChanges {
  @Input() round: Round | null = null;
  @Input() teams: Team[] = [];

  teamMap: Map<string, Team> = new Map();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['teams']) {
      this.teamMap = getTeamMap(this.teams);
    }
  }

  getTeamName(teamId: string): string {
    return this.teamMap.get(teamId)?.name ?? 'Unknown team';
  }
}
