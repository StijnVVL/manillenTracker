import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { TournamentState } from '../../models/tournament.model';
import { getCurrentRound } from '../../utils/teams';
import { RouterLink } from '@angular/router';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { L10nService } from '../../services/l10n.service';

@Component({
  selector: 'app-tournament',
  standalone: true,
  imports: [L10nPipe, RouterLink],
  template: `
    @if (state.status === 'none') {
      <div class="no-tournament">
        <button class="btn btn-primary" (click)="startNewTournament()">
          {{ 'home.setupNewTournament' | l10n }}
        </button>
      </div>
    } @else {
      <div class="tournament-ongoing">
        <p class="ongoing-message">{{ 'tournament.ongoingMessage' | l10n }}</p>
        <div class="ongoing-links">
          <a routerLink="/tournament/teams" class="ongoing-link-card">
            <span class="link-card-title">{{ 'menu.teams' | l10n }}</span>
            <span class="link-card-desc">{{ 'tournament.viewTeamsDesc' | l10n }}</span>
          </a>
          <a class="ongoing-link-card" (click)="redirectToCurrentState()">
            <span class="link-card-title">{{ 'menu.currentRound' | l10n }}</span>
            <span class="link-card-desc">{{ 'tournament.currentRoundDesc' | l10n }}</span>
          </a>
        </div>
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
    .tournament-ongoing {
      max-width: 560px;
      margin: 3rem auto;
      padding: 0 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 1.5rem;
    }
    .ongoing-message {
      margin: 0;
      line-height: 1.6;
    }
    .ongoing-links {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }
    .ongoing-link-card {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      padding: 1rem 1.25rem;
      border: none;
      border-radius: 8px;
      text-decoration: none;
      color: white;
      background: var(--primary, #1f6b3a);
      transition: background 0.15s;
      cursor: pointer;
    }
    .ongoing-link-card:hover {
      background: var(--primary-dark, #14502b);
    }
    .link-card-title {
      font-weight: 600;
      font-size: 1rem;
    }
    .link-card-desc {
      font-size: 0.875rem;
      opacity: 0.7;
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
