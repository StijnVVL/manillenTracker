import { Component, Input, OnInit, ChangeDetectionStrategy } from '@angular/core';

import { formatTime } from '../../services/timer.service';
import { RoundProgressComponent } from '../round-progress/round-progress.component';
import { TournamentService } from '../../services/tournament.service';

@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  imports: [RoundProgressComponent],
  templateUrl: './countdown-timer.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [],
})
export class CountdownTimerComponent {
  @Input() remainingSeconds: number | null = null;
  @Input() roundNumber: number = 0;
  @Input() isWarning: boolean = false;

  get formattedTime(): string {
    if (!this.remainingSeconds){
      return "--:--";
    }

    return formatTime(this.remainingSeconds);
  }
}
