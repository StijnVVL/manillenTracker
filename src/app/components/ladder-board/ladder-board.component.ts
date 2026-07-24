import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team } from '../../models/tournament.model';
import { getTeamMap } from '../../utils/teams';

@Component({
  selector: 'app-ladder-board',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ladder-board.component.html',
  styles: [],
})
export class LadderBoardComponent implements OnChanges {
  @Input() teams: Team[] = [];
  @Input() ladder: string[] = [];
  @Input() roundDiffs: Map<string, number> | undefined;
  @Input() title: string = 'Ladder';

  teamMap: Map<string, Team> = new Map();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['teams']) {
      this.teamMap = getTeamMap(this.teams);
    }
  }

  getTeamName(teamId: string): string {
    return this.teamMap.get(teamId)?.name ?? 'Unknown team';
  }

  diffLabel(teamId: string): string | null {
    const diff = this.roundDiffs?.get(teamId);
    if (diff === undefined) return null;
    if (diff > 0) return `+${diff}`;
    if (diff < 0) return `${diff}`;
    return '0';
  }

  diffClass(teamId: string): string {
    const diff = this.roundDiffs?.get(teamId);
    if (diff === undefined) return 'diff-neutral';
    if (diff > 0) return 'diff-positive';
    if (diff < 0) return 'diff-negative';
    return 'diff-neutral';
  }
}
