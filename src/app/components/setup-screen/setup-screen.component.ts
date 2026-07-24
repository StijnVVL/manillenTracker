import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentService } from '../../services/tournament.service';
import { TournamentState } from '../../models/tournament.model';

@Component({
  selector: 'app-setup-screen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="card">
      <h2 class="card-title">Tournament Setup</h2>
      <p style="color: var(--muted); margin-top: 0">
        Add fixed teams, set the round duration, then start the match. The tournament
        runs for 5 rounds. Round 1 pairings are randomized.
      </p>

      <label class="field-label" for="round-duration">
        Round duration (minutes)
      </label>
      <input
        id="round-duration"
        class="input-number"
        type="number"
        min="1"
        max="240"
        [ngModel]="state.roundDurationMinutes"
        (ngModelChange)="onDurationChange($event)"
      />

      <div style="margin-top: 1.5rem">
        <label class="field-label" for="team-name">
          Team name
        </label>
        <div class="setup-team-row">
          <input
            id="team-name"
            class="input"
            [(ngModel)]="newTeamName"
            placeholder="e.g. Team Alpha"
            (keydown.enter)="addTeam()"
          />
          <button type="button" class="btn btn-secondary" (click)="addTeam()">
            Add
          </button>
        </div>
      </div>

      @if (state.teams.length > 0) {
        <ul class="ladder-list" style="margin-top: 1rem">
          @for (team of state.teams; track team.id) {
            <li class="ladder-item">
              <input
                class="input"
                [ngModel]="editableNames[team.id]"
                (ngModelChange)="updateTeamName(team.id, $event)"
              />
              <button
                type="button"
                class="btn btn-danger"
                (click)="removeTeam(team.id)"
              >
                Remove
              </button>
            </li>
          }
        </ul>
      }

      <div class="setup-actions">
        <button
          type="button"
          class="btn btn-primary"
          [disabled]="state.teams.length < 2"
          (click)="startTournament()"
        >
          Start Tournament
        </button>
      </div>
    </div>
  `,
  styles: [],
})
export class SetupScreenComponent implements OnInit {
  state: TournamentState;
  newTeamName: string = '';
  editableNames: Record<string, string> = {};

  constructor(private tournamentService: TournamentService) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.tournamentService.state$.subscribe((state) => {
      this.state = state;
      this.updateEditableNames();
    });
    this.updateEditableNames();
  }

  private updateEditableNames(): void {
    this.editableNames = {};
    for (const team of this.state.teams) {
      this.editableNames[team.id] = team.name;
    }
  }

  addTeam(): void {
    if (!this.newTeamName.trim()) return;
    this.tournamentService.dispatch({ type: 'ADD_TEAM', name: this.newTeamName });
    this.newTeamName = '';
  }

  removeTeam(teamId: string): void {
    this.tournamentService.dispatch({ type: 'REMOVE_TEAM', teamId });
  }

  updateTeamName(teamId: string, name: string): void {
    this.editableNames[teamId] = name;
    this.tournamentService.dispatch({ type: 'UPDATE_TEAM', teamId, name });
  }

  onDurationChange(minutes: number): void {
    this.tournamentService.dispatch({ type: 'SET_ROUND_DURATION', minutes });
  }

  startTournament(): void {
    this.tournamentService.dispatch({ type: 'START_TOURNAMENT' });
  }
}
