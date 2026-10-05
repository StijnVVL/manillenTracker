import { Component, OnInit, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { TournamentState, LadderSnapshotEntry } from '../../models/tournament.model';
import { getTeamMap, getCurrentRound } from '../../utils/teams';
import { ModalDialogDirective } from '../../directives/modal-dialog.directive';

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
  imports: [L10nPipe, ModalDialogDirective],
  templateUrl: './team-results-screen.component.html',
  styleUrls: ['./team-results-screen.component.css', '../ranking-dialog/ranking-dialog.css'],
  host: { class: 'page-body' },
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class TeamResultsScreenComponent implements OnInit {
  state: TournamentState;
  entry: TeamResultEntry | null = null;
  position: number = 1;
  isRankingsDialogOpen: boolean = false;

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

  /** Position shown on the "previous" button (one rank lower), or null if none. */
  get previousPosition(): number | null {
    return this.position < this.totalTeams ? this.position + 1 : null;
  }

  /** Position shown on the "next" button (one rank higher), or null if none. */
  get nextPosition(): number | null {
    return this.position > 1 ? this.position - 1 : null;
  }

  openRankingsDialog(): void {
    this.isRankingsDialogOpen = true;
  }

  closeRankingsDialog(): void {
    this.isRankingsDialogOpen = false;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isRankingsDialogOpen) this.closeRankingsDialog();
  }

  getFinalRankings() {
    const teamMap = getTeamMap(this.state.teams);
    const earlierSnapshots = [...this.state.rounds]
      .sort((a, b) => a.number - b.number)
      .map(r => r.preRoundLadderSnapshot ?? []);

    return this.state.postRoundLadderSnapshot.map((entry, index) => ({
      teamId: entry.teamId,
      position: index + 1,
      teamName: teamMap.get(entry.teamId)?.name ?? 'Unknown',
      wins: entry.wins,
      cumulativeScore: entry.cumulativeScore,
      previousPositions: earlierSnapshots
        .map(s => s.findIndex(e => e.teamId === entry.teamId) + 1)
        .filter(p => p > 0)
        .map(p => `#${p}`),
    }));
  }

  @HostListener('document:keydown.arrowleft')
  onArrowLeft(): void {
    if (!this.isRankingsDialogOpen) this.goToPrevious();
  }

  @HostListener('document:keydown.arrowright')
  onArrowRight(): void {
    if (!this.isRankingsDialogOpen) this.goToNext();
  }

  goToPrevious(): void {
    if (this.position < this.totalTeams) {
      this.router.navigate(['/tournament/results', this.position + 1]);
    }
  }

  goToNext(): void {
    if (this.position > 1) {
      this.router.navigate(['/tournament/results', this.position - 1]);
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
