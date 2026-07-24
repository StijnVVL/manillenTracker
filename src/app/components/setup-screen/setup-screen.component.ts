import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TournamentService } from '../../services/tournament.service';
import { PageTitleService } from '../../services/page-title.service';
import { AddTeamDialogService } from '../../services/add-team-dialog.service';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { TournamentState } from '../../models/tournament.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-setup-screen',
  standalone: true,
  imports: [CommonModule, FormsModule, L10nPipe],
  templateUrl: './setup-screen.component.html',
  styleUrl: './setup-screen.component.css',
})
export class SetupScreenComponent implements OnInit, OnDestroy {
  state: TournamentState;
  editableNames: Record<string, string> = {};
  private languageSubscription: Subscription | null = null;

  constructor(
    private tournamentService: TournamentService,
    private pageTitleService: PageTitleService,
    private addTeamDialogService: AddTeamDialogService,
    public l10n: L10nService
  ) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.updatePageTitle();

    // Update page title when language changes
    this.languageSubscription = this.l10n.language$.subscribe(() => {
      this.updatePageTitle();
    });

    this.tournamentService.state$.subscribe((state) => {
      this.state = state;
      this.updateEditableNames();
    });
    this.updateEditableNames();
  }

  ngOnDestroy(): void {
    this.pageTitleService.clearTitle();
    this.languageSubscription?.unsubscribe();
  }

  private updatePageTitle(): void {
    this.pageTitleService.setTitle(this.l10n.get('pageTitle.tournamentSetup'));
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
