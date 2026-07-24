import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { formatTime } from '../../services/timer.service';
import { RoundProgressComponent } from '../round-progress/round-progress.component';
import { TournamentService } from '../../services/tournament.service';

@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  imports: [CommonModule, RoundProgressComponent],
  templateUrl: './countdown-timer.component.html',
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
