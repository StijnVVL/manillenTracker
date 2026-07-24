import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ScoreEditDialogData {
  teamAId: string;
  teamBId: string;
  teamAName: string;
  teamBName: string;
  scoreA?: number;
  scoreB?: number;
}

export interface ScoreEditDialogResult {
  scoreA: number;
  scoreB: number;
}

@Injectable({
  providedIn: 'root'
})
export class ScoreEditDialogService {
  private dialogSubject = new Subject<ScoreEditDialogData>();
  private responseSubject = new Subject<ScoreEditDialogResult | null>();

  dialog$ = this.dialogSubject.asObservable();

  open(data: ScoreEditDialogData): Promise<ScoreEditDialogResult | null> {
    this.dialogSubject.next(data);
    return new Promise<ScoreEditDialogResult | null>((resolve) => {
      const subscription = this.responseSubject.subscribe((result) => {
        subscription.unsubscribe();
        resolve(result);
      });
    });
  }

  respond(result: ScoreEditDialogResult | null): void {
    this.responseSubject.next(result);
  }
}
