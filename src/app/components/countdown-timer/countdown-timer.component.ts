import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { formatTime, getTimerColor } from '../../services/timer.service';
import { L10nService } from '../../services/l10n.service';

@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  imports: [],
  templateUrl: './countdown-timer.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [':host { display: block; width: 100%; }'],
})
export class CountdownTimerComponent {
  @Input() remainingSeconds: number | null = null;
  @Input() roundNumber: number = 0;
  @Input() isWarning: boolean = false;
  @Input() staticDurationSeconds: number | null = null;
  @Input() isEnded: boolean = false;

  constructor(private l10n: L10nService) {}

  get timerColor(): string {
    return getTimerColor(this.remainingSeconds, this.staticDurationSeconds, this.isEnded);
  }

  get formattedTime(): string {
    if (this.isEnded) {
      return this.l10n.get('roundScreen.roundFinished');
    }

    if (this.remainingSeconds !== null) {
      // clamp to [0, staticDurationSeconds] so we never show more than the full duration
      const clamped = this.staticDurationSeconds !== null
        ? Math.min(this.remainingSeconds, this.staticDurationSeconds)
        : this.remainingSeconds;
      return formatTime(clamped);
    }

    if (this.staticDurationSeconds !== null) {
      return formatTime(this.staticDurationSeconds);
    }

    return formatTime(0);
  }
}
