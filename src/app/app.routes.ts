import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { tournamentGuard } from './guards/tournament.guard';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'tournament', redirectTo: 'tournament/current', pathMatch: 'full' },
  { path: 'tournament/current', canActivate: [tournamentGuard], loadComponent: () => import('./components/tournament/tournament.component').then(m => m.TournamentComponent) },
  { path: 'tournament/rules', loadComponent: () => import('./components/rules/rules.component').then(m => m.RulesComponent), canActivate: [tournamentGuard], data: { titleKey: 'pageTitle.rules' } },
  { path: 'tournament/state', loadComponent: () => import('./components/state-editor/state-editor.component').then(m => m.StateEditorComponent), data: { titleKey: 'pageTitle.state' } },

  { path: 'tournament/:id', canActivate: [tournamentGuard], loadComponent: () => import('./components/tournament/tournament.component').then(m => m.TournamentComponent) },
  { path: 'tournament/:id/setup', canActivate: [tournamentGuard], loadComponent: () => import('./components/setup-screen/setup-screen.component').then(m => m.SetupScreenComponent), data: { titleKey: 'pageTitle.setup' } },
  { path: 'tournament/:id/teams', canActivate: [tournamentGuard], loadComponent: () => import('./components/teams-page/teams-page.component').then(m => m.TeamsPageComponent), data: { titleKey: 'pageTitle.teams' } },
  { path: 'tournament/:id/round/:roundNumber/play', canActivate: [tournamentGuard], loadComponent: () => import('./components/round-screen/round-screen.component').then(m => m.RoundScreenComponent), data: { titleKey: 'pageTitle.roundTimer' } },
  { path: 'tournament/:id/round/:roundNumber/scoring', redirectTo: 'play', pathMatch: 'full' },
  { path: 'tournament/:id/round/:roundNumber/round-winner', loadComponent: () => import('./components/round-winner-screen/round-winner-screen.component').then(m => m.RoundWinnerScreenComponent), canActivate: [tournamentGuard], data: { titleKey: 'pageTitle.roundWinner' } },
  { path: 'tournament/:id/results/:position', canActivate: [tournamentGuard], loadComponent: () => import('./components/team-results-screen/team-results-screen.component').then(m => m.TeamResultsScreenComponent), data: { titleKey: 'pageTitle.teamResults' } },

  { path: 'credits', loadComponent: () => import('./components/credits/credits.component').then(m => m.CreditsComponent), data: { titleKey: 'pageTitle.credits' } },
  { path: 'settings', loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent), data: { titleKey: 'pageTitle.settings' } },

  // Legacy redirects: old flat URLs resolve to the current tournament
  { path: 'tournament/setup', redirectTo: 'tournament/current/setup', pathMatch: 'full' },
  { path: 'tournament/teams', redirectTo: 'tournament/current/teams', pathMatch: 'full' },
  { path: 'tournament/round/:roundNumber/play', redirectTo: 'tournament/current/round/:roundNumber/play', pathMatch: 'full' },
  { path: 'tournament/round/:roundNumber/scoring', redirectTo: 'tournament/current/round/:roundNumber/play', pathMatch: 'full' },
  { path: 'tournament/round/:roundNumber/round-winner', redirectTo: 'tournament/current/round/:roundNumber/round-winner', pathMatch: 'full' },
  { path: 'tournament/results/:position', redirectTo: 'tournament/current/results/:position', pathMatch: 'full' },
  { path: 'setup', redirectTo: 'tournament/current/setup', pathMatch: 'full' },
  { path: 'teams', redirectTo: 'tournament/current/teams', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];
