import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { tournamentGuard } from './guards/tournament.guard';
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'tournament', loadComponent: () => import('./components/tournament/tournament.component').then(m => m.TournamentComponent) },
  { path: 'tournament/setup', loadComponent: () => import('./components/setup-screen/setup-screen.component').then(m => m.SetupScreenComponent), canActivate: [tournamentGuard], data: { titleKey: 'pageTitle.setup' } },
  { path: 'tournament/teams', loadComponent: () => import('./components/teams-page/teams-page.component').then(m => m.TeamsPageComponent), canActivate: [tournamentGuard], data: { titleKey: 'pageTitle.teams' } },
  { path: 'tournament/rules', loadComponent: () => import('./components/rules/rules.component').then(m => m.RulesComponent), canActivate: [tournamentGuard], data: { titleKey: 'pageTitle.rules' } },
  { path: 'tournament/state', loadComponent: () => import('./components/state-editor/state-editor.component').then(m => m.StateEditorComponent), data: { titleKey: 'pageTitle.state' } },
  { path: 'tournament/round/:roundNumber/play', loadComponent: () => import('./components/round-screen/round-screen.component').then(m => m.RoundScreenComponent), canActivate: [tournamentGuard], data: { titleKey: 'pageTitle.roundTimer' } },
  { path: 'tournament/round/:roundNumber/scoring', redirectTo: 'tournament/round/:roundNumber/play', pathMatch: 'full' },
  { path: 'tournament/round/:roundNumber/round-winner', loadComponent: () => import('./components/round-winner-screen/round-winner-screen.component').then(m => m.RoundWinnerScreenComponent), canActivate: [tournamentGuard], data: { titleKey: 'pageTitle.roundWinner' } },
  { path: 'tournament/results/:position', loadComponent: () => import('./components/team-results-screen/team-results-screen.component').then(m => m.TeamResultsScreenComponent), canActivate: [tournamentGuard], data: { titleKey: 'pageTitle.teamResults' } },
  { path: 'credits', loadComponent: () => import('./components/credits/credits.component').then(m => m.CreditsComponent), data: { titleKey: 'pageTitle.credits' } },
  { path: 'settings', loadComponent: () => import('./components/settings/settings.component').then(m => m.SettingsComponent), data: { titleKey: 'pageTitle.settings' } },
  // Legacy redirects
  { path: 'setup', redirectTo: 'tournament/setup', pathMatch: 'full' },
  { path: 'teams', redirectTo: 'tournament/teams', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];

