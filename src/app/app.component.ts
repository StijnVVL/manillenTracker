import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentService } from './services/tournament.service';
import { SetupScreenComponent } from './components/setup-screen/setup-screen.component';
import { RoundScreenComponent } from './components/round-screen/round-screen.component';
import { ScoringScreenComponent } from './components/scoring-screen/scoring-screen.component';
import { FinishedScreenComponent } from './components/finished-screen/finished-screen.component';
import { MatchupDisplayComponent } from './components/matchup-display/matchup-display.component';
import { TournamentState } from './models/tournament.model';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    SetupScreenComponent,
    RoundScreenComponent,
    ScoringScreenComponent,
    FinishedScreenComponent,
    MatchupDisplayComponent,
  ],
  template: `
    <div class="app-shell">
      <header class="app-header">
        <div>
          <h1 class="app-title">Manillen Match Tracker</h1>
          <p class="app-subtitle">Track scores, ladder positions, and round timers</p>
        </div>
        @if (state.status !== 'setup' && state.status !== 'matchup_display') {
          <button
            type="button"
            class="btn btn-ghost"
            (click)="resetTournament()"
          >
            Reset Tournament
          </button>
        }
      </header>

      @if (state.status === 'setup') {
        <app-setup-screen />
      }
      @if (state.status === 'matchup_display') {
        <app-matchup-display />
      }
      @if (state.status === 'round') {
        <app-round-screen />
      }
      @if (state.status === 'scoring') {
        <app-scoring-screen />
      }
      @if (state.status === 'finished') {
        <app-finished-screen />
      }
    </div>
  `,
  styles: [],
})
export class AppComponent implements OnInit, OnDestroy {
  state: TournamentState;

  constructor(private tournamentService: TournamentService) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.tournamentService.state$.subscribe((state) => {
      this.state = state;
    });
  }

  ngOnDestroy(): void {}

  resetTournament(): void {
    this.tournamentService.clearPersistedState();
    this.tournamentService.dispatch({ type: 'RESET_TOURNAMENT' });
  }
}
