import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { L10nService } from '../../services/l10n.service';
import { TeamListEditorComponent } from '../team-list-editor/team-list-editor.component';
import { TournamentState } from '../../models/tournament.model';
import { TeamDialogResult } from '../../services/add-team-dialog.service';
import { Subscription } from 'rxjs';
import { L10nPipe } from '../../pipes/l10n.pipe';

@Component({
  selector: 'app-teams-page',
  standalone: true,
  imports: [TeamListEditorComponent, RouterLink, L10nPipe],
  templateUrl: './teams-page.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './teams-page.component.css'
})
export class TeamsPageComponent implements OnInit, OnDestroy {
  state: TournamentState;
  private stateSubscription: Subscription | null = null;

  constructor(
    private tournamentService: TournamentService,
    private router: Router,
    public l10n: L10nService
  ) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.stateSubscription = this.tournamentService.state$.subscribe((state) => {
      this.state = state;
    });
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
  }

  get isSetup(): boolean {
    return this.state.status === 'setup';
  }

  get hasTeamWithTags(): boolean {
    return this.state.teams.length < 2 || this.state.teams.some(t => {
      const missingInfo = !t.name?.trim() || !t.player1?.trim() || !t.player2?.trim();
      const absent = !this.state.teamPresence[t.id];
      return missingInfo || absent;
    });
  }

  startTournament(): void {
    this.tournamentService.dispatch({ type: 'START_TOURNAMENT' });
    this.router.navigate(['/tournament/round', 1, 'play']);
  }

  onTeamAdded(result: TeamDialogResult): void {
    const id = crypto.randomUUID();
    this.tournamentService.dispatch({ type: 'ADD_TEAM', id, ...result });
    if (result.markAsPresent) {
      this.tournamentService.dispatch({ type: 'SET_TEAM_PRESENT', teamId: id });
    }
  }

  onTeamEdited(result: { teamId: string } & TeamDialogResult): void {
    this.tournamentService.dispatch({ type: 'UPDATE_TEAM', ...result });
  }

  onTeamRemoved(teamId: string): void {
    this.tournamentService.dispatch({ type: 'REMOVE_TEAM', teamId });
  }

  onTeamPresent(teamId: string): void {
    this.tournamentService.dispatch({ type: 'SET_TEAM_PRESENT', teamId });
  }

  onTeamAbsent(teamId: string): void {
    this.tournamentService.dispatch({ type: 'SET_TEAM_ABSENT', teamId });
  }
}
