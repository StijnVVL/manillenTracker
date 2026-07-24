import { Component, OnInit, OnDestroy } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { AddTeamDialogService } from '../../services/add-team-dialog.service';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-add-team-dialog',
  standalone: true,
  imports: [FormsModule, L10nPipe],
  templateUrl: './add-team-dialog.component.html',
  styleUrl: './add-team-dialog.component.css'
})
export class AddTeamDialogComponent implements OnInit, OnDestroy {
  isOpen = false;
  teamName = '';
  private subscription: Subscription | null = null;

  constructor(
    private addTeamDialogService: AddTeamDialogService,
    public l10n: L10nService
  ) {}

  ngOnInit(): void {
    this.subscription = this.addTeamDialogService.dialog$.subscribe(() => {
      this.teamName = '';
      this.isOpen = true;
      setTimeout(() => {
        const input = document.getElementById('add-team-name-input');
        input?.focus();
      }, 50);
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onAdd(): void {
    if (this.teamName.trim()) {
      this.isOpen = false;
      this.addTeamDialogService.respond(this.teamName.trim());
    }
  }

  onCancel(): void {
    this.isOpen = false;
    this.addTeamDialogService.respond(null);
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.onAdd();
    }
  }
}
