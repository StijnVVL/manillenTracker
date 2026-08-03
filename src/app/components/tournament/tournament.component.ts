import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { TournamentState } from '../../models/tournament.model';
import { getCurrentRound } from '../../utils/teams';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { L10nService } from '../../services/l10n.service';

@Component({
  selector: 'app-tournament',
  standalone: true,
  imports: [L10nPipe],
  template: `
    @if (state.status === 'none') {
      <div class="no-tournament">
        <button class="btn btn-primary" (click)="startNewTournament()">
          {{ 'home.setupNewTournament' | l10n }}
        </button>
      </div>
    }
  `,
  styles: [`
    .no-tournament {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      padding: 2rem;
    }
  `],
  changeDetection: ChangeDetectionStrategy.Eager,
})
export class TournamentComponent implements OnInit, OnDestroy {
  state: TournamentState;

  constructor(
    private tournamentService: TournamentService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    public l10n: L10nService
  ) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.tournamentService.state$.subscribe((state) => {
      this.state = state;
      this.cdr.markForCheck();
    });
  }

  startNewTournament(): void {
    this.tournamentService.dispatch({ type: 'RESET_TOURNAMENT' });
    this.router.navigate(['/tournament/setup']);
  }

  redirectToCurrentState(): void {
    const currentRound = getCurrentRound(this.state);

    switch (this.state.status) {
      case 'setup':
        this.router.navigate(['/tournament/setup']);
        break;
      case 'round':
        if (currentRound) {
          this.router.navigate(['/tournament/round', currentRound.number, 'play']);
        }
        break;
      case 'scoring':
        if (currentRound) {
          this.router.navigate(['/tournament/round', currentRound.number, 'scoring']);
        }
        break;
      case 'round-winner':
        if (currentRound) {
          this.router.navigate(['/tournament/round', currentRound.number, 'round-winner']);
        }
        break;
      case 'finished':
        this.router.navigate(['/tournament/finished']);
        break;
    }
  }

  ngOnDestroy(): void {}
}
