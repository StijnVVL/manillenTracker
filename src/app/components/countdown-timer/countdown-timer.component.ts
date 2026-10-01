import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { formatTime, getTimerColor } from '../../services/timer.service';
import { L10nService } from '../../services/l10n.service';
import { L10nPipe } from '../../pipes/l10n.pipe';

@Component({
  selector: 'app-countdown-timer',
  standalone: true,
  imports: [L10nPipe],
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

  /**
   * The time split into numeric segments (e.g. ['24','35']) so the template can
   * render raised colons between them like a digital sleep clock. Empty when the
   * timer is showing non-numeric text (e.g. "round finished").
   */
  get timeSegments(): string[] {
    if (this.isEnded) return [];
    return this.formattedTime.split(':');
  }

  /**
   * Opacity of the colon, synced to the live countdown: jumps to 1 (fully
   * opaque) exactly when the second changes, then fades down to 0.2 just before
   * the next second. When there is no live countdown (idle/paused) it stays
   * fully opaque.
   */
  get colonOpacity(): number {
    if (this.remainingSeconds === null || this.remainingSeconds <= 0) return 1;
    const fraction = this.remainingSeconds - Math.floor(this.remainingSeconds);
    // Counting down: fraction is ~1 right after a second change, ~0 just before
    // the next. Map that to 1 -> 0.2.
    return 0.2 + 0.8 * fraction;
  }
}
