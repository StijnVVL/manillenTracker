import { Component, OnInit, OnDestroy, ChangeDetectionStrategy, HostListener } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { AddTeamDialogService, TeamDialogData } from '../../services/add-team-dialog.service';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-team-dialog',
  standalone: true,
  imports: [FormsModule, L10nPipe],
  templateUrl: './add-team-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './add-team-dialog.component.css'
})
export class AddTeamDialogComponent implements OnInit, OnDestroy {
  isOpen = false;
  mode: 'add' | 'edit' = 'add';
  teamName = '';
  player1 = '';
  player2 = '';
  showPresenceCheckbox = false;
  markAsPresent = true;
  private subscription: Subscription | null = null;

  constructor(
    private addTeamDialogService: AddTeamDialogService,
    public l10n: L10nService
  ) {}

  ngOnInit(): void {
    this.subscription = this.addTeamDialogService.dialog$.subscribe((data: TeamDialogData) => {
      this.mode = data.mode;
      this.showPresenceCheckbox = data.showPresenceCheckbox ?? false;
      this.markAsPresent = true;
      if (data.mode === 'edit' && data.team) {
        this.teamName = data.team.name;
        this.player1 = data.team.player1;
        this.player2 = data.team.player2;
      } else {
        this.teamName = '';
        this.player1 = '';
        this.player2 = '';
      }
      this.isOpen = true;
      setTimeout(() => {
        const firstEmptyId = !this.teamName.trim() ? 'team-name-input'
          : !this.player1.trim() ? 'player1-input'
          : !this.player2.trim() ? 'player2-input'
          : 'team-name-input';
        (document.getElementById(firstEmptyId) as HTMLElement)?.focus();
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

  get titleKey(): string {
    return this.mode === 'edit' ? 'dialog.editTeam.title' : 'dialog.addTeam.title';
  }

  get submitButtonKey(): string {
    return this.mode === 'edit' ? 'common.save' : 'common.add';
  }

  get isValid(): boolean {
    return this.teamName.trim().length > 0;
  }

  onSubmit(): void {
    if (this.isValid) {
      this.isOpen = false;
      this.addTeamDialogService.respond({
        name: this.teamName.trim(),
        player1: this.player1.trim(),
        player2: this.player2.trim(),
        markAsPresent: this.showPresenceCheckbox ? this.markAsPresent : undefined,
      });
    }
  }

  onCancel(): void {
    this.isOpen = false;
    this.addTeamDialogService.respond(null);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && this.isValid) {
      this.onSubmit();
    }
  }
}
