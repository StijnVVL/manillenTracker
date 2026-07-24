import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';

import { Round, Team } from '../../models/tournament.model';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { getTeamMap } from '../../utils/teams';

@Component({
  selector: 'app-matchup-list',
  standalone: true,
  imports: [L10nPipe],
  templateUrl: './matchup-list.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
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
