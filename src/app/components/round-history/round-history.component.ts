import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Round, Team, TOTAL_ROUNDS } from '../../models/tournament.model';
import { getMatchupWinner } from '../../logic/standings';
import { getTeamMap } from '../../utils/teams';

@Component({
  selector: 'app-round-history',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (completedRounds.length > 0) {
      <details class="card collapsible">
        <summary>Round History</summary>
        <ul class="history-list">
          @for (round of completedRounds; track round.number) {
            <li class="history-item">
              <div>
                <strong>Round {{ round.number }}</strong>
                @for (matchup of round.matchups; track matchup.teamAId + matchup.teamBId; let tableIndex = $index) {
                  <div [class]="'history-matchup ' + (tableIndex === 0 ? 'history-table-one' : '')">
                    <span>
                      Table {{ tableIndex + 1 }}: {{ getTeamName(matchup.teamAId) }} {{ scoreLabel(matchup.teamAId, round) }} vs {{ getTeamName(matchup.teamBId) }} {{ scoreLabel(matchup.teamBId, round) }}
                    </span>
                    @if (tableWinnerId(round, tableIndex)) {
                      <span class="history-winner">
                        Winner: {{ getTeamName(tableWinnerId(round, tableIndex)!) }}
                        @if (isFinalTable1(round, tableIndex)) {
                          (Champion)
                        }
                      </span>
                    }
                  </div>
                }
                @if (round.byeTeamId) {
                  <div style="margin-top: 0.35rem; color: var(--muted)">
                    Bye: {{ getTeamName(round.byeTeamId) }}
                  </div>
                }
              </div>
            </li>
          }
        </ul>
      </details>
    }
  `,
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
