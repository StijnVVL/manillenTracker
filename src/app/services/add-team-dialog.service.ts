import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AddTeamDialogService {
  private dialogSubject = new Subject<void>();
  private responseSubject = new Subject<string | null>();

  dialog$ = this.dialogSubject.asObservable();

  open(): Promise<string | null> {
    this.dialogSubject.next();
    return new Promise<string | null>((resolve) => {
      const subscription = this.responseSubject.subscribe((result) => {
        subscription.unsubscribe();
        resolve(result);
      });
    });
  }

  respond(teamName: string | null): void {
    this.responseSubject.next(teamName);
  }
}
