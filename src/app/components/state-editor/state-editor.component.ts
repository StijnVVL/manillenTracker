import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';

import { EditorState } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { syntaxHighlighting, defaultHighlightStyle, foldGutter, foldKeymap, bracketMatching } from '@codemirror/language';
import { json } from '@codemirror/lang-json';
import { lintKeymap } from '@codemirror/lint';

import { TournamentService } from '../../services/tournament.service';
import { ConfirmDialogService } from '../../services/confirm-dialog.service';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { TournamentState } from '../../models/tournament.model';

@Component({
  selector: 'app-state-editor',
  standalone: true,
  imports: [CommonModule, L10nPipe, RouterLink],
  templateUrl: './state-editor.component.html',
  styleUrl: './state-editor.component.css',
  changeDetection: ChangeDetectionStrategy.Default,
})
export class StateEditorComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('editorHost') editorHost!: ElementRef<HTMLDivElement>;

  parseError: string | null = null;
  private stateSub?: Subscription;
  private editorView?: EditorView;
  private ignoreNextStateUpdate = false;

  constructor(
    private tournamentService: TournamentService,
    private confirmDialogService: ConfirmDialogService,
    private l10n: L10nService,
    private router: Router,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.stateSub = this.tournamentService.state$.subscribe(state => {
      if (this.ignoreNextStateUpdate) {
        this.ignoreNextStateUpdate = false;
        return;
      }
      if (!this.editorView) return;
      // Only overwrite if the editor still contains valid JSON that matches
      // the last persisted state (i.e. the user hasn't made unsaved edits)
      const current = this.editorView.state.doc.toString();
      const incoming = JSON.stringify(state, null, 2);
      try {
        if (JSON.stringify(JSON.parse(current)) === JSON.stringify(state)) {
          this.setEditorContent(incoming);
        }
      } catch {
        // user has invalid JSON — don't overwrite
      }
    });
  }

  ngAfterViewInit(): void {
    const initialContent = JSON.stringify(this.tournamentService.state, null, 2);

    const updateListener = EditorView.updateListener.of(update => {
      if (update.docChanged) {
        const text = update.state.doc.toString();
        try {
          JSON.parse(text);
          this.parseError = null;
        } catch (e: any) {
          this.parseError = e.message;
        }
        this.cdr.markForCheck();
      }
    });

    this.editorView = new EditorView({
      state: EditorState.create({
        doc: initialContent,
        extensions: [
          history(),
          lineNumbers(),
          highlightActiveLine(),
          foldGutter(),
          bracketMatching(),
          syntaxHighlighting(defaultHighlightStyle),
          json(),
          keymap.of([...defaultKeymap, ...historyKeymap, ...foldKeymap, ...lintKeymap]),
          updateListener,
          EditorView.theme({
            '&': { height: '100%', fontSize: '0.85rem' },
            '.cm-scroller': { fontFamily: "'Consolas', 'Menlo', 'Monaco', monospace", overflow: 'auto' },
          }),
        ],
      }),
      parent: this.editorHost.nativeElement,
    });
  }

  ngOnDestroy(): void {
    this.stateSub?.unsubscribe();
    this.editorView?.destroy();
  }

  private setEditorContent(text: string): void {
    if (!this.editorView) return;
    this.editorView.dispatch({
      changes: { from: 0, to: this.editorView.state.doc.length, insert: text },
    });
  }

  get isValid(): boolean {
    return this.parseError === null;
  }

  async save(): Promise<void> {
    if (!this.isValid || !this.editorView) return;

    const confirmed = await this.confirmDialogService.confirm({
      title: this.l10n.get('stateEditor.confirmTitle'),
      message: this.l10n.get('stateEditor.confirmMessage'),
      confirmText: this.l10n.get('stateEditor.confirmSave'),
      cancelText: this.l10n.get('common.cancel'),
    });

    if (confirmed) {
      this.ignoreNextStateUpdate = true;
      const newState = JSON.parse(this.editorView.state.doc.toString()) as TournamentState;
      this.tournamentService.dispatch({ type: 'RESTORE_STATE', state: newState });
      this.router.navigate(['/tournament']);
    }
  }
}

