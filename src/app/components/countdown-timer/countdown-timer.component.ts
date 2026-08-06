import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { formatTime } from '../../services/timer.service';
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
    if (this.isEnded) return '#e53935';
    if (this.remainingSeconds === null || this.staticDurationSeconds === null || this.staticDurationSeconds <= 0) {
      return '#2e7d32'; // green when idle/static
    }
    // ratio 1 = full time left (green), 0 = no time left (red)
    const ratio = Math.min(1, Math.max(0, this.remainingSeconds / this.staticDurationSeconds));
    // green  #2e7d32 (46,125,50)  ->  orange #e65100 (230,81,0)  ->  red #c62828 (198,40,40)
    let r: number, g: number, b: number;
    if (ratio >= 0.5) {
      // green -> orange  (ratio 1..0.5)
      const t = (1 - ratio) * 2;  // 0..1
      r = Math.round(46  + t * (230 - 46));
      g = Math.round(125 + t * (81  - 125));
      b = Math.round(50  + t * (0   - 50));
    } else {
      // orange -> red  (ratio 0.5..0)
      const t = (0.5 - ratio) * 2; // 0..1
      r = Math.round(230 + t * (198 - 230));
      g = Math.round(81  + t * (40  - 81));
      b = Math.round(0   + t * (40  - 0));
    }
    return `rgb(${r},${g},${b})`;
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
