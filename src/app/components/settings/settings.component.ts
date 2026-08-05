import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../services/settings.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { LanguageSelectorComponent } from '../language-selector/language-selector.component';
import { TeamListEditorComponent } from '../team-list-editor/team-list-editor.component';
import { SvgIconComponent } from '../svg-icon/svg-icon.component';
import { SettingsState } from '../../models/settings.model';
import { AlgorithmSelectorComponent } from '../algorithm-selector/algorithm-selector.component';
import { EXCLUSION_PICKERS, EXCLUSION_SCORERS } from '../../logic/matchup-algorithm';
import type { ExclusionPicker, ExclusionScorer } from '../../logic/matchup-algorithm';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, L10nPipe, LanguageSelectorComponent, TeamListEditorComponent, SvgIconComponent, AlgorithmSelectorComponent],
  templateUrl: './settings.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './settings.component.css'
})
export class SettingsComponent implements OnInit {
  readonly exclusionPickers: ExclusionPicker[] = EXCLUSION_PICKERS;
  readonly exclusionScorers: ExclusionScorer[] = EXCLUSION_SCORERS;
  settingsState: SettingsState;

  durationValue: number;
  totalRoundsValue: number;
  defaultTournamentNameValue: string;
  durationError: string | null = null;
  totalRoundsError: string | null = null;

  constructor(private settingsService: SettingsService) {
    this.settingsState = settingsService.state;
    this.durationValue = settingsService.state.roundDurationMinutes;
    this.totalRoundsValue = settingsService.state.defaultTotalRounds;
    this.defaultTournamentNameValue = settingsService.state.defaultTournamentName;
  }

  ngOnInit(): void {
    this.settingsService.state$.subscribe((state) => {
      this.settingsState = state;
      if (!this.durationError) this.durationValue = state.roundDurationMinutes;
      if (!this.totalRoundsError) this.totalRoundsValue = state.defaultTotalRounds;
      this.defaultTournamentNameValue = state.defaultTournamentName;
    });
  }

  onDefaultTournamentNameChange(name: string): void {
    this.settingsService.dispatch({ type: 'SET_DEFAULT_TOURNAMENT_NAME', name });
  }

  onDurationChange(value: number | null): void {
    this.durationError = this.validateDuration(value);
    if (!this.durationError) {
      this.settingsService.dispatch({ type: 'SET_ROUND_DURATION', minutes: value as number });
    }
  }

  onTotalRoundsChange(value: number | null): void {
    this.totalRoundsError = this.validateTotalRounds(value);
    if (!this.totalRoundsError) {
      this.settingsService.dispatch({ type: 'SET_DEFAULT_TOTAL_ROUNDS', totalRounds: value as number });
    }
  }

  onTeamAdded(result: { name: string; player1: string; player2: string }): void {
    this.settingsService.dispatch({ type: 'ADD_SETTINGS_TEAM', ...result });
  }

  onTeamEdited(result: { teamId: string; name: string; player1: string; player2: string }): void {
    this.settingsService.dispatch({ type: 'UPDATE_SETTINGS_TEAM', ...result });
  }

  onTeamRemoved(teamId: string): void {
    this.settingsService.dispatch({ type: 'REMOVE_SETTINGS_TEAM', teamId });
  }

  get currentPickerOption() {
    return this.exclusionPickers.find(p => p.id === this.settingsState.exclusionPickerId);
  }

  get currentScorerOption() {
    return this.exclusionScorers.find(s => s.id === this.settingsState.exclusionScorerId);
  }

  onExclusionPickerChange(exclusionPickerId: string): void {
    this.settingsService.dispatch({ type: 'SET_EXCLUSION_PICKER', exclusionPickerId });
  }

  onExclusionScorerChange(exclusionScorerId: string): void {
    this.settingsService.dispatch({ type: 'SET_EXCLUSION_SCORER', exclusionScorerId });
  }

  private validateDuration(value: number | null): string | null {
    if (value === null || !Number.isInteger(value) || value < 1 || value > 120) {
      return 'settings.roundDurationError';
    }
    return null;
  }

  private validateTotalRounds(value: number | null): string | null {
    if (value === null || !Number.isInteger(value) || value < 1 || value > 10) {
      return 'settings.totalRoundsError';
    }
    return null;
  }
}
