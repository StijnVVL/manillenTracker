import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentService } from '../../services/tournament.service';
import { PageTitleService } from '../../services/page-title.service';
import { TournamentState } from '../../models/tournament.model';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit, OnDestroy {
  state: TournamentState;

  constructor(
    private tournamentService: TournamentService,
    private pageTitleService: PageTitleService
  ) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.pageTitleService.setTitle('Settings');
    this.tournamentService.state$.subscribe((state) => {
      this.state = state;
    });
  }

  ngOnDestroy(): void {
    this.pageTitleService.clearTitle();
  }

  onDurationChange(minutes: number): void {
    this.tournamentService.dispatch({ type: 'SET_ROUND_DURATION', minutes });
  }
}
