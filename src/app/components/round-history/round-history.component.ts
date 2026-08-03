import { Component, Input, OnChanges, SimpleChanges, ChangeDetectionStrategy } from '@angular/core';

import { Round, Team } from '../../models/tournament.model';
import { TournamentService } from '../../services/tournament.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { getMatchupWinner } from '../../logic/standings';
import { getTeamMap } from '../../utils/teams';

@Component({
  selector: 'app-round-history',
  standalone: true,
  imports: [L10nPipe],
  templateUrl: './round-history.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [],
})
export class RoundHistoryComponent implements OnChanges {
  @Input() rounds: Round[] = [];
  @Input() teams: Team[] = [];

  teamMap: Map<string, Team> = new Map();
  completedRounds: Round[] = [];

  constructor(private tournamentService: TournamentService) {}

  get totalRounds(): number {
    return this.tournamentService.state.totalRounds;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['teams']) {
      this.teamMap = getTeamMap(this.teams);
    }
    this.completedRounds = this.rounds.filter(
      (round, index) => {
        const hasScores = round.matchups.some(m => m.teamAScore !== undefined || m.teamBScore !== undefined);
        return index < this.rounds.length - 1 || hasScores;
      }
    );
  }

  getTeamName(teamId: string): string {
    return this.teamMap.get(teamId)?.name ?? 'Unknown team';
  }

  scoreLabel(teamId: string, round: Round): string {
    // Find the matchup containing this team
    const matchup = round.matchups.find(m => m.teamAId === teamId || m.teamBId === teamId);
    if (!matchup) return '—';

    const isTeamA = matchup.teamAId === teamId;
    const score = isTeamA ? matchup.teamAScore : matchup.teamBScore;
    const opponentScore = isTeamA ? matchup.teamBScore : matchup.teamAScore;

    if (score === undefined || opponentScore === undefined) return '—';

    const diff = score - opponentScore;
    return `${score} (${diff >= 0 ? '+' : ''}${diff})`;
  }

  tableWinnerId(round: Round, tableIndex: number): string | null {
    return getMatchupWinner(round, tableIndex);
  }

  isFinalTable1(round: Round, tableIndex: number): boolean {
    return round.number === this.totalRounds && tableIndex === 0 && this.tableWinnerId(round, tableIndex) !== null;
  }
}
