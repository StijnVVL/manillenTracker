import { Component, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { TournamentService } from '../../services/tournament.service';
import { getExclusionPickerById, getExclusionScorerById } from '../../logic/matchup-algorithm';

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [L10nPipe, RouterLink],
  templateUrl: './rules.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrls: ['./rules.component.css', '../round-screen/team-tooltip.css']
})
export class RulesComponent {
  readonly slideTitleKeys = ['rules.tournament.title', 'rules.round.title', 'rules.manillen.title'];
  slideIndex = 0;

  constructor(private tournamentService: TournamentService, private router: Router) {}

  get isSetup(): boolean {
    return this.tournamentService.state.status === 'setup';
  }

  get canStart(): boolean {
    return this.teamCount >= 2 && this.missingInfoCount === 0 && this.absentCount === 0;
  }

  get teamCount(): number {
    return this.tournamentService.state.teams.length;
  }

  get missingInfoCount(): number {
    return this.tournamentService.state.teams
      .filter(t => !t.name?.trim() || !t.player1?.trim() || !t.player2?.trim()).length;
  }

  get absentCount(): number {
    return this.tournamentService.state.teams.filter(t => !t.present).length;
  }

  startTooltipVisible = false;
  tooltipX = 0;
  tooltipY = 0;

  showStartTooltip(event: MouseEvent): void {
    this.startTooltipVisible = true;
    this.updateStartTooltipPosition(event);
  }

  /** Places the popup above-left of the cursor, since the button sits at the bottom-right. */
  updateStartTooltipPosition(event: MouseEvent): void {
    this.tooltipX = Math.max(8, event.clientX - 334);
    this.tooltipY = Math.max(8, event.clientY - 150);
  }

  hideStartTooltip(): void {
    this.startTooltipVisible = false;
  }

  startTournament(): void {
    this.tournamentService.dispatch({ type: 'START_TOURNAMENT' });
    this.router.navigate(['/tournament/round', 1, 'play']);
  }

  get hasPrevious(): boolean {
    return this.slideIndex > 0;
  }

  get hasNext(): boolean {
    return this.slideIndex < this.slideTitleKeys.length - 1;
  }

  @HostListener('document:keydown.arrowleft')
  goToPrevious(): void {
    if (this.hasPrevious) this.slideIndex--;
  }

  @HostListener('document:keydown.arrowright')
  goToNext(): void {
    if (this.hasNext) this.slideIndex++;
  }

  get totalRounds(): number {
    return this.tournamentService.state.totalRounds;
  }

  get roundDurationMinutes(): number {
    return Math.round(this.tournamentService.state.roundDurationSeconds / 60);
  }

  get points60_0(): number {
    return this.tournamentService.state.points60_0;
  }

  get exclusionMethodNameKey(): string {
    return getExclusionPickerById(this.tournamentService.state.exclusionPickerId).nameKey;
  }

  get scoringMethodNameKey(): string {
    return getExclusionScorerById(this.tournamentService.state.exclusionScorerId).nameKey;
  }
}
