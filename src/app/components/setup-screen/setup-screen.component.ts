import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentService } from '../../services/tournament.service';
import { PageTitleService } from '../../services/page-title.service';
import { AddTeamDialogService } from '../../services/add-team-dialog.service';
import { TournamentState } from '../../models/tournament.model';

@Component({
  selector: 'app-setup-screen',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './setup-screen.component.html',
  styleUrl: './setup-screen.component.css',
})
export class SetupScreenComponent implements OnInit, OnDestroy {
  state: TournamentState;
  editableNames: Record<string, string> = {};

  constructor(
    private tournamentService: TournamentService,
    private pageTitleService: PageTitleService,
    private addTeamDialogService: AddTeamDialogService
  ) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.pageTitleService.setTitle('Tournament Setup');
    this.tournamentService.state$.subscribe((state) => {
      this.state = state;
      this.updateEditableNames();
    });
    this.updateEditableNames();
  }

  ngOnDestroy(): void {
    this.pageTitleService.clearTitle();
  }

  private updateEditableNames(): void {
    this.editableNames = {};
    for (const team of this.state.teams) {
      this.editableNames[team.id] = team.name;
    }
  }

  async openAddTeamDialog(): Promise<void> {
    const teamName = await this.addTeamDialogService.open();
    if (teamName) {
      this.tournamentService.dispatch({ type: 'ADD_TEAM', name: teamName });
    }
  }

  removeTeam(teamId: string): void {
    this.tournamentService.dispatch({ type: 'REMOVE_TEAM', teamId });
  }

  updateTeamName(teamId: string, name: string): void {
    this.editableNames[teamId] = name;
    this.tournamentService.dispatch({ type: 'UPDATE_TEAM', teamId, name });
  }

  startTournament(): void {
    this.tournamentService.dispatch({ type: 'START_TOURNAMENT' });
  }
}
