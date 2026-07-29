import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { TournamentService } from '../../services/tournament.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';
import { TournamentState } from '../../models/tournament.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, L10nPipe, LanguageSelectorComponent],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  state: TournamentState;

  constructor(private tournamentService: TournamentService) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.tournamentService.state$.subscribe((state) => {
      this.state = state;
    });
  }

  onDurationChange(minutes: number): void {
    this.tournamentService.dispatch({ type: 'SET_ROUND_DURATION', minutes });
  }
}
