import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { Team } from '../models/tournament.model';

export interface TeamDialogData {
  mode: 'add' | 'edit';
  team?: Team;
  showPresenceCheckbox?: boolean;
}

export interface TeamDialogResult {
  name: string;
  player1: string;
  player2: string;
  markAsPresent?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AddTeamDialogService {
  private dialogSubject = new Subject<TeamDialogData>();
  private responseSubject = new Subject<TeamDialogResult | null>();

  dialog$ = this.dialogSubject.asObservable();

  openAdd(showPresenceCheckbox = false): Promise<TeamDialogResult | null> {
    this.dialogSubject.next({ mode: 'add', showPresenceCheckbox });
    return new Promise<TeamDialogResult | null>((resolve) => {
      const subscription = this.responseSubject.subscribe((result) => {
        subscription.unsubscribe();
        resolve(result);
      });
    });
  }

  openEdit(team: Team): Promise<TeamDialogResult | null> {
    this.dialogSubject.next({ mode: 'edit', team });
    return new Promise<TeamDialogResult | null>((resolve) => {
      const subscription = this.responseSubject.subscribe((result) => {
        subscription.unsubscribe();
        resolve(result);
      });
    });
  }

  respond(result: TeamDialogResult | null): void {
    this.responseSubject.next(result);
  }
}
