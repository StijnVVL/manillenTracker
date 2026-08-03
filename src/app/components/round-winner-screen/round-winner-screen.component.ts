import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { TournamentState, Round, Matchup } from '../../models/tournament.model';
import { getRoundByNumber, getCurrentRound, getTeamMap, isRoundInFuture, isPageInFuture } from '../../utils/teams';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';

interface RoundWinner {
  teamId: string;
  teamName: string;
  pointDifference: number;
  place: number;
}

@Component({
  selector: 'app-round-winner-screen',
  standalone: true,
  imports: [CommonModule, L10nPipe],
  templateUrl: './round-winner-screen.component.html',
  styleUrl: './round-winner-screen.component.css',
})
export class RoundWinnerScreenComponent implements OnInit {
  state: TournamentState;
  currentRound: Round | null = null;
  displayRound: Round | null = null;
  roundNumber: number = 1;
  winners: RoundWinner[] = [];
  isFutureRound: boolean = false;
  isFuturePage: boolean = false;

  constructor(
    private tournamentService: TournamentService,
    public l10n: L10nService,
    private confirmDialogService: ConfirmDialogService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.roundNumber = +params['roundNumber'];
      this.checkIfFutureRound();
      this.loadRound();
    });

    this.tournamentService.state$.subscribe((state) => {
      this.state = state;
      this.currentRound = getCurrentRound(state);
      this.checkIfFutureRound();
      this.loadRound();
      this.calculateRoundWinners();
    });
  }

  checkIfFutureRound(): void {
    this.isFutureRound = isRoundInFuture(this.state, this.roundNumber);
    this.isFuturePage = isPageInFuture(this.state, this.roundNumber, 'round-winner');
  }

  goToCurrentRound(): void {
    if (this.currentRound) {
      this.router.navigate(['/tournament/round', this.currentRound.number, 'round-winner']);
    }
  }

  loadRound(): void {
    this.displayRound = getRoundByNumber(this.state, this.roundNumber);
  }

  get isCurrentRound(): boolean {
    return this.currentRound?.number === this.displayRound?.number;
  }

  calculateRoundWinners(): void {
    if (!this.displayRound) {
      this.winners = [];
      return;
    }

    const teamMap = getTeamMap(this.state.teams);
    const winnerData: RoundWinner[] = [];

    // Calculate point difference for each matchup
    for (const matchup of this.displayRound.matchups) {
      if (matchup.teamAScore !== undefined && matchup.teamBScore !== undefined) {
        const scoreA = matchup.teamAScore;
        const scoreB = matchup.teamBScore;
        const diff = Math.abs(scoreA - scoreB);

        if (scoreA > scoreB) {
          winnerData.push({
            teamId: matchup.teamAId,
            teamName: teamMap.get(matchup.teamAId)?.name ?? 'Unknown',
            pointDifference: diff,
            place: 0
          });
        } else if (scoreB > scoreA) {
          winnerData.push({
            teamId: matchup.teamBId,
            teamName: teamMap.get(matchup.teamBId)?.name ?? 'Unknown',
            pointDifference: diff,
            place: 0
          });
        }
      }
    }

    // Sort by point difference descending
    winnerData.sort((a, b) => b.pointDifference - a.pointDifference);

    // Assign places (1, 2, 3)
    winnerData.forEach((winner, index) => {
      winner.place = index + 1;
    });

    // Take top 3
    this.winners = winnerData.slice(0, 3);
  }

  nextRound(): void {
    if (!this.isCurrentRound || !this.displayRound) return;

    this.confirmDialogService.confirm({
      title: this.l10n.get('dialog.nextRound.title'),
      message: this.l10n.get('dialog.nextRound.message'),
      confirmText: this.l10n.get('dialog.nextRound.confirm')
    }).then((confirmed) => {
      if (confirmed) {
        this.tournamentService.dispatch({ type: 'NEXT_ROUND' });
        const newRound = this.tournamentService.state.rounds[this.tournamentService.state.rounds.length - 1];
        this.router.navigate(['/tournament/round', newRound.number, 'play']);
      }
    });
  }

  backToScoring(): void {
    if (this.displayRound) {
      this.router.navigate(['/tournament/round', this.displayRound.number, 'scoring']);
    }
  }
}
