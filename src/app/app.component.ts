import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink } from '@angular/router';
import { TournamentService } from './services/tournament.service';
import { PageTitleService } from './services/page-title.service';
import { ConfirmDialogService } from './services/confirm-dialog.service';
import { ConfirmDialogComponent } from './components/confirm-dialog/confirm-dialog.component';
import { AddTeamDialogComponent } from './components/add-team-dialog/add-team-dialog.component';
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
    private confirmDialogService: ConfirmDialogService
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
      title: 'Reset Tournament',
      message: 'Are you sure you want to reset the tournament? All progress will be lost.',
      confirmText: 'Reset',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      this.tournamentService.clearPersistedState();
      this.tournamentService.dispatch({ type: 'RESET_TOURNAMENT' });
    }
  }
}
