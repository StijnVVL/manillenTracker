import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

import { TournamentService } from '../../services/tournament.service';
import { L10nPipe } from '../../pipes/l10n.pipe';

@Component({
  selector: 'app-round-progress',
  standalone: true,
  imports: [L10nPipe],
  templateUrl: './round-progress.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [],
})
export class RoundProgressComponent {
  @Input() roundNumber: number = 0;

  constructor(public tournamentService: TournamentService) {}

  get totalRounds(): number {
    return this.tournamentService.state.totalRounds;
  }
}
