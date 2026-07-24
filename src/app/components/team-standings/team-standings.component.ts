import { Component, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentState, Team } from '../../models/tournament.model';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { computeStandings } from '../../logic/standings';
import { getTeamMap } from '../../utils/teams';
import { TeamStanding } from '../../logic/standings';

@Component({
  selector: 'app-team-standings',
  standalone: true,
  imports: [CommonModule, L10nPipe],
  templateUrl: './team-standings.component.html',
  styles: [],
})
export class TeamStandingsComponent implements OnChanges, OnInit {
  @Input() state: TournamentState | null = null;
  @Input() title: string | undefined;

  displayTitle: string = '';
  teamMap: Map<string, Team> = new Map();
  standings: TeamStanding[] = [];

  constructor(private l10n: L10nService) {}

  ngOnInit(): void {
    this.displayTitle = this.title ?? this.l10n.get('teamStandings.defaultTitle');
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.state) {
      this.teamMap = getTeamMap(this.state.teams);
      this.standings = computeStandings(this.state);
    }
    if (changes['title']) {
      this.displayTitle = this.title ?? this.l10n.get('teamStandings.defaultTitle');
    }
  }

  getTeamName(teamId: string): string {
    return this.teamMap.get(teamId)?.name ?? 'Unknown team';
  }
}
