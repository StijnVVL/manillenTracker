import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { SettingsService } from '../../services/settings.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { L10nService } from '../../services/l10n.service';
import { SvgIconComponent } from '../svg-icon/svg-icon.component';
import { TournamentState } from '../../models/tournament.model';
import { AlgorithmSelectorComponent } from '../algorithm-selector/algorithm-selector.component';
import { EXCLUSION_PICKERS, EXCLUSION_SCORERS } from '../../logic/matchup-algorithm';
import type { ExclusionPicker, ExclusionScorer } from '../../logic/matchup-algorithm';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-setup-screen',
  standalone: true,
  imports: [CommonModule, FormsModule, L10nPipe, SvgIconComponent, AlgorithmSelectorComponent],
  templateUrl: './setup-screen.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './setup-screen.component.css',
})
export class SetupScreenComponent implements OnInit, OnDestroy {
  readonly exclusionPickers: ExclusionPicker[] = EXCLUSION_PICKERS;
  readonly exclusionScorers: ExclusionScorer[] = EXCLUSION_SCORERS;
  state: TournamentState;

  durationValue: number;
  durationError: string | null = null;

  private stateSubscription: Subscription | null = null;

  constructor(
    private tournamentService: TournamentService,
    private settingsService: SettingsService,
    private router: Router,
    public l10n: L10nService,
  ) {
    this.state = tournamentService.state;
    this.durationValue = tournamentService.state.roundDurationSeconds / 60;
  }

  ngOnInit(): void {
    this.stateSubscription = this.tournamentService.state$.subscribe((state) => {
      this.state = state;
      if (!this.durationError) {
        this.durationValue = state.roundDurationSeconds / 60;
      }
    });
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
  }

  get hasTeamWithTags(): boolean {
    return this.state.teams.some(t => {
      const missingInfo = !t.name?.trim() || !t.player1?.trim() || !t.player2?.trim();
      const absent = !this.state.teamPresence[t.id];
      return missingInfo || absent;
    });
  }

  get isSetup(): boolean {
    return this.state.status === 'setup';
  }

  goToTeams(): void {
    this.router.navigate(['/tournament/teams']);
  }

  onTournamentNameChange(name: string): void {
    this.tournamentService.dispatch({ type: 'SET_TOURNAMENT_NAME', name });
  }

  onDurationChange(value: number | null): void {
    this.durationError = this.validateDuration(value);
    if (!this.durationError) {
      this.tournamentService.dispatch({
        type: 'SET_SETUP_ROUND_DURATION',
        roundDurationSeconds: (value as number) * 60,
      });
    }
  }

  onTotalRoundsChange(totalRounds: number): void {
    this.tournamentService.dispatch({ type: 'SET_TOTAL_ROUNDS', totalRounds });
  }

  get currentPickerOption() {
    return this.exclusionPickers.find(p => p.id === this.state.exclusionPickerId);
  }

  get currentScorerOption() {
    return this.exclusionScorers.find(s => s.id === this.state.exclusionScorerId);
  }

  onExclusionPickerChange(exclusionPickerId: string): void {
    this.tournamentService.dispatch({ type: 'SET_EXCLUSION_PICKER_TOURNAMENT', exclusionPickerId });
  }

  onExclusionScorerChange(exclusionScorerId: string): void {
    this.tournamentService.dispatch({ type: 'SET_EXCLUSION_SCORER_TOURNAMENT', exclusionScorerId });
  }

  private validateDuration(value: number | null): string | null {
    if (value === null || !Number.isInteger(value) || value < 1 || value > 120) {
      return 'settings.roundDurationError';
    }
    return null;
  }
}
