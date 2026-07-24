import { Component, OnInit, OnDestroy } from '@angular/core';

import { TournamentService } from '../../services/tournament.service';
import { PageTitleService } from '../../services/page-title.service';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { getCurrentRound } from '../../utils/teams';
import { TournamentState, Round, Team } from '../../models/tournament.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-matchup-display',
  standalone: true,
  imports: [L10nPipe],
  templateUrl: './matchup-display.component.html',
  styleUrl: './matchup-display.component.css',
})
export class MatchupDisplayComponent implements OnInit, OnDestroy {
  state: TournamentState;
  currentRound: Round | null = null;
  teamMap: Map<string, Team> = new Map();
  private languageSubscription: Subscription | null = null;

  constructor(
    private tournamentService: TournamentService,
    private pageTitleService: PageTitleService,
    private l10n: L10nService
  ) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.tournamentService.state$.subscribe((state) => {
      this.state = state;
      this.currentRound = getCurrentRound(state);
      this.teamMap = new Map(state.teams.map(t => [t.id, t]));
      this.updateTitle();
    });
    this.languageSubscription = this.l10n.language$.subscribe(() => {
      this.updateTitle();
    });
  }

  ngOnDestroy(): void {
    this.pageTitleService.clearTitle();
    this.languageSubscription?.unsubscribe();
  }

  private updateTitle(): void {
    if (this.currentRound) {
      this.pageTitleService.setTitle(
        this.l10n.get('pageTitle.roundMatchups', { roundNumber: this.currentRound.number })
      );
    }
  }

  getTeamName(teamId: string): string {
    return this.teamMap.get(teamId)?.name ?? 'Unknown team';
  }

  startRound(): void {
    // Start the timer - the state will change to running
    // and RoundScreen will be shown automatically
    this.tournamentService.dispatch({ type: 'INIT_ROUND' });
  }
}
