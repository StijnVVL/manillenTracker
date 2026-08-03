import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { TournamentState } from '../../models/tournament.model';
import { getCurrentRound } from '../../utils/teams';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [],
  template: '',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: []
})
export class HomeComponent implements OnInit, OnDestroy {
  state: TournamentState;

  constructor(
    private tournamentService: TournamentService,
    private router: Router
  ) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.tournamentService.state$.subscribe((state) => {
      this.state = state;
      this.redirectToCurrentState();
    });
  }

  redirectToCurrentState(): void {
    const currentRound = getCurrentRound(this.state);

    switch (this.state.status) {
      case 'setup':
        this.router.navigate(['/setup']);
        break;
      case 'round':
        if (currentRound) {
          this.router.navigate(['/round', currentRound.number, 'timer']);
        }
        break;
      case 'scoring':
        if (currentRound) {
          this.router.navigate(['/round', currentRound.number, 'scoring']);
        }
        break;
      case 'round-winner':
        if (currentRound) {
          this.router.navigate(['/round', currentRound.number, 'round-winner']);
        }
        break;
      case 'finished':
        this.router.navigate(['/finished']);
        break;
    }
  }

  ngOnDestroy(): void {}
}
