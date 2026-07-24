import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TOTAL_ROUNDS } from '../../models/tournament.model';

@Component({
  selector: 'app-round-progress',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="round-progress">
      Round {{ roundNumber }} of {{ TOTAL_ROUNDS }}
    </div>
  `,
  styles: [],
})
export class RoundProgressComponent {
  @Input() roundNumber: number = 0;
  TOTAL_ROUNDS = TOTAL_ROUNDS;
}
