import { Component, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { TournamentService } from './services/tournament.service';
import { ConfirmDialogService } from './services/confirm-dialog.service';
import { L10nService } from './services/l10n.service';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { AddTeamDialogComponent } from './components/add-team-dialog/add-team-dialog.component';
import { ScoreEditDialogComponent } from './components/score-edit-dialog/score-edit-dialog.component';
import { L10nPipe } from './pipes/l10n.pipe';
import { BreadcrumbComponent } from './components/breadcrumb/breadcrumb.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    ConfirmDialogComponent,
    AddTeamDialogComponent,
    ScoreEditDialogComponent,
    L10nPipe,
    BreadcrumbComponent
  ],
  templateUrl: './app.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './app.component.css',
})
export class AppComponent implements OnDestroy {
  menuOpen = false;

  constructor(
    private tournamentService: TournamentService,
    private confirmDialogService: ConfirmDialogService,
    private router: Router,
    private l10n: L10nService
  ) {}

  get hasTournament(): boolean {
    return this.tournamentService.state.status !== 'none';
  }

  get tournamentStatus(): string {
    return this.tournamentService.state.status;
  }

  get tournamentName(): string {
    return this.tournamentService.state.tournamentName;
  }

  get currentRoundNumber(): number | null {
    const state = this.tournamentService.state;
    if (!state.rounds || state.rounds.length === 0) return null;
    return state.rounds[state.rounds.length - 1].number;
  }

  get currentRoundSubRoute(): string {
    const s = this.tournamentService.state.status;
    if (s === 'scoring') return 'scoring';
    if (s === 'round-winner') return 'round-winner';
    return 'play';
  }

  get isPostSetup(): boolean {
    const s = this.tournamentService.state.status;
    return s === 'round' || s === 'scoring' || s === 'round-winner' || s === 'finished';
  }

  ngOnDestroy(): void {}

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  async stopTournament(): Promise<void> {
    this.closeMenu();

    const confirmed = await this.confirmDialogService.confirm({
      title: this.l10n.get('dialog.stopTournament.title'),
      message: this.l10n.get('dialog.stopTournament.message'),
      confirmText: this.l10n.get('dialog.stopTournament.confirm'),
      cancelText: this.l10n.get('common.cancel')
    });

    if (confirmed) {
      this.tournamentService.dispatch({ type: 'STOP_TOURNAMENT' });
      this.router.navigate(['/']);
    }
  }
}
