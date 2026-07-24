import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Round, Team } from '../../models/tournament.model';
import { getTeamMap } from '../../utils/teams';

@Component({
  selector: 'app-matchup-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './matchup-list.component.html',
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
