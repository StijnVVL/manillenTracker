import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Team } from '../../models/tournament.model';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { getTeamMap } from '../../utils/teams';

@Component({
  selector: 'app-ladder-board',
  standalone: true,
  imports: [CommonModule, L10nPipe],
  templateUrl: './ladder-board.component.html',
  styles: [],
})
export class LadderBoardComponent implements OnChanges, OnInit {
  @Input() teams: Team[] = [];
  @Input() ladder: string[] = [];
  @Input() roundDiffs: Map<string, number> | undefined;
  @Input() title: string | undefined;

  displayTitle: string = '';
  teamMap: Map<string, Team> = new Map();

  constructor(private l10n: L10nService) {}

  ngOnInit(): void {
    this.displayTitle = this.title ?? this.l10n.get('ladderBoard.defaultTitle');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['teams']) {
      this.teamMap = getTeamMap(this.teams);
    }
    if (changes['title']) {
      this.displayTitle = this.title ?? this.l10n.get('ladderBoard.defaultTitle');
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
