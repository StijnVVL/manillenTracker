import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentService } from '../../services/tournament.service';
import { TournamentState } from '../../models/tournament.model';

@Component({
  selector: 'app-setup-screen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setup-screen.component.html',
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
