import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConfirmDialogService, ConfirmDialogData } from '../../services/confirm-dialog.service';
import { L10nService } from '../../services/l10n.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent implements OnInit, OnDestroy {
  isOpen = false;
  data: ConfirmDialogData | null = null;
  private subscription: Subscription | null = null;

  constructor(
    private confirmDialogService: ConfirmDialogService,
    public l10n: L10nService
  ) {}

  ngOnInit(): void {
    this.subscription = this.confirmDialogService.dialog$.subscribe((data) => {
      this.data = data;
      this.isOpen = true;
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  onConfirm(): void {
    this.isOpen = false;
    this.confirmDialogService.respond(true);
  }

  onCancel(): void {
    this.isOpen = false;
    this.confirmDialogService.respond(false);
  }

  onOverlayClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }
}
