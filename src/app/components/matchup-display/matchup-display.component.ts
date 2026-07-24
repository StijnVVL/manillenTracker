import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentService } from '../../services/tournament.service';
import { getCurrentRound } from '../../utils/teams';
import { TournamentState, Round, Team } from '../../models/tournament.model';

@Component({
  selector: 'app-matchup-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="matchup-display-shell">
      <header class="matchup-display-header">
        <h1 class="matchup-display-title">Round {{ currentRound?.number }} Matchups</h1>
        <p class="matchup-display-subtitle">Please move to your assigned tables</p>
      </header>

      @if (currentRound) {
        <div class="matchup-display-grid">
          @for (matchup of currentRound.matchups; track matchup.teamAId + matchup.teamBId; let index = $index) {
            <div class="matchup-display-card">
              <div class="matchup-display-table">Table {{ index + 1 }}</div>
              <div class="matchup-display-vs">VS</div>
              <div class="matchup-display-team">{{ getTeamName(matchup.teamAId) }}</div>
              <div class="matchup-display-team">{{ getTeamName(matchup.teamBId) }}</div>
            </div>
          }
          @if (currentRound.byeTeamId) {
            <div class="matchup-display-card bye-card">
              <div class="matchup-display-table">Bye</div>
              <div class="matchup-display-team">{{ getTeamName(currentRound.byeTeamId) }}</div>
            </div>
          }
        </div>

        <div class="matchup-display-start">
          <button
            type="button"
            class="btn btn-primary btn-large"
            (click)="startRound()"
          >
            Start Timer
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .matchup-display-shell {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .matchup-display-header {
      text-align: center;
      margin-bottom: 2rem;
    }
    .matchup-display-title {
      font-size: clamp(2rem, 5vw, 3.5rem);
      margin: 0;
      color: var(--primary-dark);
    }
    .matchup-display-subtitle {
      font-size: clamp(1.2rem, 2.5vw, 1.8rem);
      margin: 0.5rem 0 0;
      color: var(--muted);
    }
    .matchup-display-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.5rem;
      flex: 1;
    }
    .matchup-display-card {
      background: var(--bg-card);
      border: 2px solid var(--primary);
      border-radius: 20px;
      padding: 2rem;
      text-align: center;
      box-shadow: var(--shadow);
    }
    .matchup-display-card.bye-card {
      border-color: var(--muted);
    }
    .matchup-display-table {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--primary-dark);
      margin-bottom: 1rem;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .matchup-display-vs {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--primary);
      margin: 1rem 0;
      letter-spacing: 0.1em;
    }
    .matchup-display-team {
      font-size: 1.4rem;
      font-weight: 600;
      padding: 0.75rem;
      margin: 0.5rem 0;
      background: rgba(255, 255, 255, 0.6);
      border-radius: 10px;
      color: var(--primary-dark);
    }
    .matchup-display-start {
      text-align: center;
      margin-top: 2rem;
    }
    .btn-large {
      padding: 1rem 2.5rem;
      font-size: 1.2rem;
      font-weight: 700;
    }
  `],
})
export class MatchupDisplayComponent implements OnInit {
  state: TournamentState;
  currentRound: Round | null = null;
  teamMap: Map<string, Team> = new Map();

  constructor(private tournamentService: TournamentService) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.tournamentService.state$.subscribe((state) => {
      this.state = state;
      this.currentRound = getCurrentRound(state);
      this.teamMap = new Map(state.teams.map(t => [t.id, t]));
    });
  }

  getTeamName(teamId: string): string {
    return this.teamMap.get(teamId)?.name ?? 'Unknown team';
  }

  startRound(): void {
    // Start the timer - the state will change to running
    // and RoundScreen will be shown automatically
    this.tournamentService.dispatch({ type: 'START_ROUND' });
  }
}
