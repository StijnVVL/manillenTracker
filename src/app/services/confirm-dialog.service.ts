import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmText?: string;
  confirmTextUnchecked?: string;
  confirmClass?: string;
  cancelText?: string;
  checkboxLabel?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfirmDialogService {
  private dialogSubject = new Subject<ConfirmDialogData>();
  private responseSubject = new Subject<boolean>();

  dialog$ = this.dialogSubject.asObservable();
  lastCheckboxChecked = false;

  setLastCheckboxChecked(val: boolean): void {
    this.lastCheckboxChecked = val;
  }

  confirm(data: ConfirmDialogData): Promise<boolean> {
    this.dialogSubject.next(data);
    return new Promise<boolean>((resolve) => {
      const subscription = this.responseSubject.subscribe((result) => {
        subscription.unsubscribe();
        resolve(result);
      });
    });
  }

  respond(result: boolean): void {
    this.responseSubject.next(result);
  }
}
