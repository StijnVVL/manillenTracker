import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Round, Team, TOTAL_ROUNDS } from '../../models/tournament.model';
import { getMatchupWinner } from '../../logic/standings';
import { getTeamMap } from '../../utils/teams';

@Component({
  selector: 'app-round-history',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './round-history.component.html',
  styles: [],
})
export class RoundHistoryComponent implements OnChanges {
  @Input() rounds: Round[] = [];
  @Input() teams: Team[] = [];
  @Input() currentRoundIndex: number = -1;

  teamMap: Map<string, Team> = new Map();
  completedRounds: Round[] = [];
  TOTAL_ROUNDS = TOTAL_ROUNDS;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['teams']) {
      this.teamMap = getTeamMap(this.teams);
    }
    this.completedRounds = this.rounds.filter(
      (round, index) => index < this.currentRoundIndex || round.results.length > 0,
    );
  }

  getTeamName(teamId: string): string {
    return this.teamMap.get(teamId)?.name ?? 'Unknown team';
  }

  scoreLabel(teamId: string, round: Round): string {
    const result = round.results.find((r) => r.teamId === teamId);
    if (!result) return '—';
    return `${result.rawScore} (${result.matchDiff >= 0 ? '+' : ''}${result.matchDiff})`;
  }

  tableWinnerId(round: Round, tableIndex: number): string | null {
    return getMatchupWinner(round, tableIndex);
  }

  isFinalTable1(round: Round, tableIndex: number): boolean {
    return round.number === this.TOTAL_ROUNDS && tableIndex === 0 && this.tableWinnerId(round, tableIndex) !== null;
  }
}
