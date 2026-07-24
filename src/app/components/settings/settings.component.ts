import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentService } from '../../services/tournament.service';
import { PageTitleService } from '../../services/page-title.service';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';
import { TournamentState } from '../../models/tournament.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, L10nPipe, LanguageSelectorComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit, OnDestroy {
  state: TournamentState;
  private languageSubscription: Subscription | null = null;

  constructor(
    private tournamentService: TournamentService,
    private pageTitleService: PageTitleService,
    private l10n: L10nService
  ) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.updatePageTitle();
    this.languageSubscription = this.l10n.language$.subscribe(() => {
      this.updatePageTitle();
    });
    this.tournamentService.state$.subscribe((state) => {
      this.state = state;
    });
  }

  ngOnDestroy(): void {
    this.pageTitleService.clearTitle();
    this.languageSubscription?.unsubscribe();
  }

  private updatePageTitle(): void {
    this.pageTitleService.setTitle(this.l10n.get('pageTitle.settings'));
  }

  onDurationChange(minutes: number): void {
    this.tournamentService.dispatch({ type: 'SET_ROUND_DURATION', minutes });
  }
}
