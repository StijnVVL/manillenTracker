import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';

import { TournamentService } from '../../services/tournament.service';
import { SetupScreenComponent } from '../setup-screen/setup-screen.component';
import { RoundScreenComponent } from '../round-screen/round-screen.component';
import { ScoringScreenComponent } from '../scoring-screen/scoring-screen.component';
import { FinishedScreenComponent } from '../finished-screen/finished-screen.component';
import { TournamentState } from '../../models/tournament.model';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    SetupScreenComponent,
    RoundScreenComponent,
    ScoringScreenComponent,
    FinishedScreenComponent
],
  templateUrl: './home.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
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
