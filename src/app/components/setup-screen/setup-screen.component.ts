import { Component, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TournamentService } from '../../services/tournament.service';
import { L10nPipe } from '../../pipes/l10n.pipe';
import { TournamentState } from '../../models/tournament.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-setup-screen',
  standalone: true,
  imports: [CommonModule, RouterLink, L10nPipe],
  templateUrl: './setup-screen.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './setup-screen.component.css',
})
export class SetupScreenComponent implements OnInit, OnDestroy {
  state: TournamentState;
  private stateSubscription: Subscription | null = null;

  constructor(private tournamentService: TournamentService) {
    this.state = tournamentService.state;
  }

  ngOnInit(): void {
    this.stateSubscription = this.tournamentService.state$.subscribe((state) => {
      this.state = state;
    });
  }

  ngOnDestroy(): void {
    this.stateSubscription?.unsubscribe();
  }

  startTournament(): void {
    this.tournamentService.dispatch({ type: 'START_TOURNAMENT' });
  }
}
