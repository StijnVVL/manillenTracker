import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentService } from '../../services/tournament.service';
import { SetupScreenComponent } from '../setup-screen/setup-screen.component';
import { RoundScreenComponent } from '../round-screen/round-screen.component';
import { ScoringScreenComponent } from '../scoring-screen/scoring-screen.component';
import { FinishedScreenComponent } from '../finished-screen/finished-screen.component';
import { MatchupDisplayComponent } from '../matchup-display/matchup-display.component';
import { TournamentState } from '../../models/tournament.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    SetupScreenComponent,
    RoundScreenComponent,
    ScoringScreenComponent,
    FinishedScreenComponent,
    MatchupDisplayComponent,
  ],
  templateUrl: './home.component.html',
  styles: []
})
export class HomeComponent implements OnInit, OnDestroy {
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
}
