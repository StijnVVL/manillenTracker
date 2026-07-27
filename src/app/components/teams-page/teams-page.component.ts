import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TournamentService } from '../../services/tournament.service';
import { PageTitleService } from '../../services/page-title.service';
import { AddTeamDialogService } from '../../services/add-team-dialog.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { TournamentState, Team } from '../../models/tournament.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-teams-page',
  standalone: true,
  imports: [CommonModule, L10nPipe],
  templateUrl: './teams-page.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './teams-page.component.css'
})
export class TeamsPageComponent implements OnInit, OnDestroy {
  state: TournamentState;
  private stateSubscription: Subscription | null = null;
  private languageSubscription: Subscription | null = null;

  constructor(
    private tournamentService: TournamentService,
    private pageTitleService: PageTitleService,
    private addTeamDialogService: AddTeamDialogService,
    private confirmDialogService: ConfirmDialogService,
    public l10n: L10nService
  ) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.updatePageTitle();

    this.languageSubscription = this.l10n.language$.subscribe(() => {
      this.updatePageTitle();
    });

    this.stateSubscription = this.tournamentService.state$.subscribe((state) => {
      this.state = state;
    });
  }

  ngOnDestroy(): void {
    this.pageTitleService.clearTitle();
    this.languageSubscription?.unsubscribe();
    this.stateSubscription?.unsubscribe();
  }

  private updatePageTitle(): void {
    this.pageTitleService.setTitle(this.l10n.get('pageTitle.teams'));
  }

  get canModifyTeams(): boolean {
    return this.state.status === 'setup';
  }

  get leftColumnTeams(): Team[] {
    const midpoint = Math.ceil(this.state.teams.length / 2);
    return this.state.teams.slice(0, midpoint);
  }

  get rightColumnTeams(): Team[] {
    const midpoint = Math.ceil(this.state.teams.length / 2);
    return this.state.teams.slice(midpoint);
  }

  getTeamIndex(team: Team): number {
    return this.state.teams.indexOf(team) + 1;
  }

  async openAddTeamDialog(): Promise<void> {
    const result = await this.addTeamDialogService.openAdd();
    if (result) {
      this.tournamentService.dispatch({
        type: 'ADD_TEAM',
        name: result.name,
        player1: result.player1,
        player2: result.player2
      });
    }
  }

  async openEditTeamDialog(team: Team): Promise<void> {
    const result = await this.addTeamDialogService.openEdit(team);
    if (result) {
      this.tournamentService.dispatch({
        type: 'UPDATE_TEAM',
        teamId: team.id,
        name: result.name,
        player1: result.player1,
        player2: result.player2
      });
    }
  }

  async confirmRemoveTeam(team: Team): Promise<void> {
    const confirmed = await this.confirmDialogService.confirm({
      title: this.l10n.get('dialog.removeTeam.title'),
      message: this.l10n.get('dialog.removeTeam.message', { teamName: team.name }),
      confirmText: this.l10n.get('dialog.removeTeam.confirm'),
      cancelText: this.l10n.get('common.cancel')
    });

    if (confirmed) {
      this.tournamentService.dispatch({ type: 'REMOVE_TEAM', teamId: team.id });
    }
  }
}
