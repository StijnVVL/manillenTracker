import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { PageTitleService } from '../../services/page-title.service';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { TournamentState } from '../../models/tournament.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-setup-screen',
  standalone: true,
  imports: [CommonModule, RouterLink, L10nPipe],
  templateUrl: './setup-screen.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './setup-screen.component.css',
})
export class SetupScreenComponent implements OnInit, OnDestroy {
  state: TournamentState;
  private languageSubscription: Subscription | null = null;
  private stateSubscription: Subscription | null = null;

  constructor(
    private tournamentService: TournamentService,
    private pageTitleService: PageTitleService,
    public l10n: L10nService
  ) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.updatePageTitle();

    this.languageSubscription = this.l10n.language$.subscribe(() => {
      this.updatePageTitle();
    });

    this.stateSubscription = this.tournamentService.state$.subscribe((state) => {
      this.state = state;
    });
  }

  ngOnDestroy(): void {
    this.pageTitleService.clearTitle();
    this.languageSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }

  private updatePageTitle(): void {
    this.pageTitleService.setTitle(this.l10n.get('pageTitle.tournamentSetup'));
  }

  startTournament(): void {
    this.tournamentService.dispatch({ type: 'START_TOURNAMENT' });
  }
}
