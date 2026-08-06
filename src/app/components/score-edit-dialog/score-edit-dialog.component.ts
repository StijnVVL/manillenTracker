import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScoreEditDialogService, ScoreEditDialogData } from '../../services/score-edit-dialog.service';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { SvgIconComponent } from '../svg-icon/svg-icon.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-score-edit-dialog',
  standalone: true,
  imports: [FormsModule, L10nPipe, SvgIconComponent],
  templateUrl: './score-edit-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './score-edit-dialog.component.css'
})
export class ScoreEditDialogComponent implements OnInit, OnDestroy {
  readonly capWarnThreshold = 100;
  readonly capMaxScore = 1000;
  isOpen = false;
  teamAId = '';
  teamBId = '';
  teamAName = '';
  teamBName = '';
  scoreA: number | undefined = undefined;
  scoreB: number | undefined = undefined;
  private subscription: Subscription | null = null;

  constructor(
    private scoreEditDialogService: ScoreEditDialogService,
    public l10n: L10nService
  ) {}

  ngOnInit(): void {
    this.subscription = this.scoreEditDialogService.dialog$.subscribe((data: ScoreEditDialogData) => {
      this.teamAId = data.teamAId;
      this.teamBId = data.teamBId;
      this.teamAName = data.teamAName;
      this.teamBName = data.teamBName;
      this.scoreA = data.scoreA;
      this.scoreB = data.scoreB;
      this.isOpen = true;
      setTimeout(() => {
        const input = document.getElementById('score-team-a');
        input?.focus();
      }, 50);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.isOpen) this.onCancel();
  }

  get scoreAError(): boolean {
    return this.scoreA !== undefined && this.scoreA >= this.capMaxScore;
  }

  get scoreBError(): boolean {
    return this.scoreB !== undefined && this.scoreB >= this.capMaxScore;
  }

  get canSave(): boolean {
    return this.scoreA !== undefined && this.scoreA !== null &&
           this.scoreB !== undefined && this.scoreB !== null &&
           !Number.isNaN(this.scoreA) && !Number.isNaN(this.scoreB) &&
           this.scoreA >= 0 && this.scoreB >= 0 &&
           !this.scoreAError && !this.scoreBError;
  }

  get showScoreWarning(): boolean {
    return (this.scoreA !== undefined && this.scoreA >= this.capWarnThreshold && !this.scoreAError) ||
           (this.scoreB !== undefined && this.scoreB >= this.capWarnThreshold && !this.scoreBError);
  }

  onScoreInput(event: Event, field: 'A' | 'B'): void {
    const input = event.target as HTMLInputElement;
    // Strip non-digits
    let raw = input.value.replace(/[^0-9]/g, '');
    // Strip leading zeros
    raw = raw.replace(/^0+([0-9])/, '$1');
    // Cap at 4 characters
    if (raw.length > 4) raw = raw.slice(0, 4);
    const num = raw === '' ? undefined : Number(raw);
    if (field === 'A') { this.scoreA = num; }
    else { this.scoreB = num; }
    input.value = raw;
  }

  onSave(): void {
    if (this.canSave && this.scoreA !== undefined && this.scoreB !== undefined) {
      this.isOpen = false;
      this.scoreEditDialogService.respond({
        scoreA: this.scoreA,
        scoreB: this.scoreB
      });
    }
  }

  onCancel(): void {
    this.isOpen = false;
    this.scoreEditDialogService.respond(null);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.canSave) {
      this.onSave();
    }
  }
}
