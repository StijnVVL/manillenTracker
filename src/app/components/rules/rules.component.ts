import { Component, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { RouterLink } from '@angular/router';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { TournamentService } from '../../services/tournament.service';
import { getExclusionPickerById, getExclusionScorerById } from '../../logic/matchup-algorithm';

@Component({
  selector: 'app-rules',
  standalone: true,
  imports: [L10nPipe, RouterLink],
  templateUrl: './rules.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './rules.component.css'
})
export class RulesComponent {
  readonly slideTitleKeys = ['rules.tournament.title', 'rules.round.title', 'rules.manillen.title'];
  slideIndex = 0;

  constructor(private tournamentService: TournamentService) {}

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
