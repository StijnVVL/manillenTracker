import { Component, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

import { RouterOutlet, RouterLink, ActivatedRoute } from '@angular/router';
import { TournamentService } from './services/tournament.service';
import { ConfirmDialogService } from './services/confirm-dialog.service';
import { L10nService } from './services/l10n.service';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { AddTeamDialogComponent } from './components/add-team-dialog/add-team-dialog.component';
import { ScoreEditDialogComponent } from './components/score-edit-dialog/score-edit-dialog.component';
import { L10nPipe } from './pipes/l10n.pipe';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    RouterLink,
    ConfirmDialogComponent,
    AddTeamDialogComponent,
    ScoreEditDialogComponent,
    L10nPipe
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
    private activatedRoute: ActivatedRoute,
    private l10n: L10nService
  ) {}

  get pageTitle(): string {
    let route = this.activatedRoute;
    while (route.firstChild) route = route.firstChild;
    const titleKey = route.snapshot.data['titleKey'] as string | undefined;

    // Get round number from params if available
    const roundNumber = route.snapshot.params['roundNumber'];

    if (titleKey) {
      // If we have a roundNumber, pass it as a parameter
      if (roundNumber) {
        return this.l10n.get(titleKey, { roundNumber: +roundNumber });
      }
      return this.l10n.get(titleKey);
    }
    if (this.tournamentService.state.status === 'setup') return this.l10n.get('pageTitle.tournamentSetup');
    return '';
  }

  ngOnDestroy(): void {}

  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  closeMenu(): void {
    this.menuOpen = false;
  }

  async resetTournament(): Promise<void> {
    this.closeMenu();

    const confirmed = await this.confirmDialogService.confirm({
      title: this.l10n.get('dialog.resetTournament.title'),
      message: this.l10n.get('dialog.resetTournament.message'),
      confirmText: this.l10n.get('common.reset'),
      cancelText: this.l10n.get('common.cancel')
    });

    if (confirmed) {
      this.tournamentService.clearPersistedState();
      this.tournamentService.dispatch({ type: 'RESET_TOURNAMENT' });
    }
  }
}
