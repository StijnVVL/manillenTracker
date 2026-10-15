import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { TournamentService } from '../services/tournament.service';

export const tournamentGuard: CanActivateFn = (route) => {
  const tournamentService = inject(TournamentService);
  const router = inject(Router);
  if (tournamentService.state.status === 'none') {
    return router.createUrlTree(['/tournament']);
  }
  const urlId = route.paramMap.get('id');
  if (urlId && urlId !== 'current' && urlId !== tournamentService.state.id) {
    return router.createUrlTree(['/tournament', tournamentService.state.id]);
  }
  return true;
};
