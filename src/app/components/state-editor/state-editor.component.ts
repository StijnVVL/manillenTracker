import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { TournamentService } from '../../services/tournament.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { TournamentState } from '../../models/tournament.model';

@Component({
  selector: 'app-state-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, L10nPipe, RouterLink],
  templateUrl: './state-editor.component.html',
  styleUrl: './state-editor.component.css',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class StateEditorComponent implements OnInit, OnDestroy {
  jsonText = '';
  parseError: string | null = null;
  private stateSub?: Subscription;

  constructor(
    private tournamentService: TournamentService,
    private confirmDialogService: ConfirmDialogService,
    private l10n: L10nService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.jsonText = JSON.stringify(this.tournamentService.state, null, 2);

    this.stateSub = this.tournamentService.state$.subscribe(state => {
      // Only overwrite if the user hasn't made unsaved edits (text is still valid and matches state)
      if (this.parseError === null) {
        const incoming = JSON.stringify(state, null, 2);
        if (this.jsonText === JSON.stringify(JSON.parse(this.jsonText), null, 2)) {
          this.jsonText = incoming;
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.stateSub?.unsubscribe();
  }

  onTextChange(): void {
    try {
      JSON.parse(this.jsonText);
      this.parseError = null;
    } catch (e: any) {
      this.parseError = e.message;
    }
  }

  get isValid(): boolean {
    return this.parseError === null;
  }

  async save(): Promise<void> {
    if (!this.isValid) return;

    const confirmed = await this.confirmDialogService.confirm({
      title: this.l10n.get('stateEditor.confirmTitle'),
      message: this.l10n.get('stateEditor.confirmMessage'),
      confirmText: this.l10n.get('stateEditor.confirmSave'),
      cancelText: this.l10n.get('common.cancel'),
    });

    if (confirmed) {
      const newState = JSON.parse(this.jsonText) as TournamentState;
      this.tournamentService.dispatch({ type: 'RESTORE_STATE', state: newState });
      this.router.navigate(['/tournament']);
    }
  }
}
