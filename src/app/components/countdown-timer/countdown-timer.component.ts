import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { formatTime } from '../../services/timer.service';
import { RoundProgressComponent } from '../round-progress/round-progress.component';

@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  imports: [CommonModule, RoundProgressComponent],
  template: `
    <section class="timer-section">
      <app-round-progress [roundNumber]="roundNumber" />
      <div [class]="'countdown ' + (isWarning ? 'countdown-warning' : '')">
        {{ formattedTime }}
      </div>
    </section>
  `,
  styles: [],
})
export class CountdownTimerComponent {
  @Input() remainingMs: number = 0;
  @Input() roundNumber: number = 0;
  @Input() isWarning: boolean = false;

  get formattedTime(): string {
    return formatTime(this.remainingMs);
  }
}
