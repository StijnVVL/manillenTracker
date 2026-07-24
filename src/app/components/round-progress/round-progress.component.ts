import { Component, Input } from '@angular/core';

import { TOTAL_ROUNDS } from '../../models/tournament.model';
import { L10nPipe } from '../../pipes/l10n.pipe';

@Component({
  selector: 'app-round-progress',
  standalone: true,
  imports: [L10nPipe],
  templateUrl: './round-progress.component.html',
  styles: [],
})
export class RoundProgressComponent {
  @Input() roundNumber: number = 0;
  TOTAL_ROUNDS = TOTAL_ROUNDS;
}
