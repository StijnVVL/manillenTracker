import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TournamentService } from '../services/tournament.service';

export const tournamentGuard: CanActivateFn = () => {
  const tournamentService = inject(TournamentService);
  const router = inject(Router);

  if (tournamentService.state.status === 'none') {
    return router.createUrlTree(['/tournament']);
  }
  return true;
};
