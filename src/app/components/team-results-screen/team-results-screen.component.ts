import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { TournamentState, LadderSnapshotEntry } from '../../models/tournament.model';
import { getTeamMap, getCurrentRound } from '../../utils/teams';

interface TeamResultEntry {
  position: number;
  teamId: string;
  teamName: string;
  wins: number;
  cumulativeScore: number;
  roundScores: number[];
  exclusions: number;
}

@Component({
  selector: 'app-team-results-screen',
  standalone: true,
  imports: [L10nPipe],
  templateUrl: './team-results-screen.component.html',
  styleUrl: './team-results-screen.component.css',
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class TeamResultsScreenComponent implements OnInit {
  state: TournamentState;
  entry: TeamResultEntry | null = null;
  position: number = 1;

  constructor(
    private tournamentService: TournamentService,
    private route: ActivatedRoute,
    private router: Router,
    public l10n: L10nService,
  ) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      const raw = params['position'];
      const snapshot = this.tournamentService.state.postRoundLadderSnapshot;
      this.position = raw === 'last' ? snapshot.length : +raw;
      this.loadEntry();
    });

    this.tournamentService.state$.subscribe(state => {
      this.state = state;
      this.loadEntry();
    });
  }

  private loadEntry(): void {
    const snapshot = this.state.postRoundLadderSnapshot;
    const index = this.position - 1;

    if (index < 0 || index >= snapshot.length) {
      this.entry = null;
      return;
    }

    const snapshotEntry: LadderSnapshotEntry = snapshot[index];
    const teamMap = getTeamMap(this.state.teams);

    this.entry = {
      position: this.position,
      teamId: snapshotEntry.teamId,
      teamName: teamMap.get(snapshotEntry.teamId)?.name ?? 'Unknown',
      wins: snapshotEntry.wins,
      cumulativeScore: snapshotEntry.cumulativeScore,
      roundScores: [...snapshotEntry.roundScores],
      exclusions: snapshotEntry.exclusions,
    };
  }

  get isTournamentOngoing(): boolean {
    return this.state.status !== 'finished';
  }

  get currentRound() {
    const rounds = this.state.rounds;
    return rounds?.length ? rounds[rounds.length - 1] : null;
  }

  goToCurrentRound(): void {
    const round = this.currentRound;
    if (round) {
      const subPage = this.state.status === 'round-winner' ? 'round-winner' : 'play';
      this.router.navigate(['/tournament/round', round.number, subPage]);
    } else {
      this.router.navigate(['/tournament']);
    }
  }

  get totalTeams(): number {
    return this.state.postRoundLadderSnapshot.length;
  }

  get medalEmoji(): string {
    if (this.position === 1) return '🥇';
    if (this.position === 2) return '🥈';
    if (this.position === 3) return '🥉';
    return '';
  }

  goToPrevious(): void {
    if (this.position > 1) {
      this.router.navigate(['/tournament/results', this.position - 1]);
    }
  }

  goToNext(): void {
    if (this.position < this.totalTeams) {
      this.router.navigate(['/tournament/results', this.position + 1]);
    }
  }

  goBack(): void {
    const current = getCurrentRound(this.state);
    if (current) {
      this.router.navigate(['/tournament/round', current.number, 'round-winner']);
    } else {
      this.router.navigate(['/tournament']);
    }
  }
}
