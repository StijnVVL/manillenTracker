import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { TournamentService } from './services/tournament.service';
import { PageTitleService } from './services/page-title.service';
import { ConfirmDialogService } from './services/confirm-dialog.service';
import { L10nService } from './services/l10n.service';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { AddTeamDialogComponent } from './components/add-team-dialog/add-team-dialog.component';
import { L10nPipe } from './pipes/l10n.pipe';
import { TournamentState } from './models/tournament.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    ConfirmDialogComponent,
    AddTeamDialogComponent,
    L10nPipe,
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
})
export class AppComponent implements OnInit, OnDestroy {
  state: TournamentState;
  menuOpen = false;
  pageTitle = '';

  constructor(
    private tournamentService: TournamentService,
    private pageTitleService: PageTitleService,
    private confirmDialogService: ConfirmDialogService,
    private l10n: L10nService
  ) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.tournamentService.state$.subscribe((state) => {
      this.state = state;
    });
    this.pageTitleService.title$.subscribe((title) => {
      this.pageTitle = title;
    });
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
