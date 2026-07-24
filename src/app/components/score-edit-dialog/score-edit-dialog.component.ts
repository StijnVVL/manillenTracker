import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ScoreEditDialogService, ScoreEditDialogData } from '../../services/score-edit-dialog.service';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-score-edit-dialog',
  standalone: true,
  imports: [FormsModule, L10nPipe],
  templateUrl: './score-edit-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './score-edit-dialog.component.css'
})
export class ScoreEditDialogComponent implements OnInit, OnDestroy {
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

  get canSave(): boolean {
    return this.scoreA !== undefined && this.scoreB !== undefined &&
           !Number.isNaN(this.scoreA) && !Number.isNaN(this.scoreB);
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

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.canSave) {
      this.onSave();
    }
  }
}
