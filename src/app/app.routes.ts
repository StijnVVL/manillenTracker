import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { TournamentComponent } from './components/tournament/tournament.component';
import { CreditsComponent } from './components/credits/credits.component';
import { SettingsComponent } from './components/settings/settings.component';
import { TeamsPageComponent } from './components/teams-page/teams-page.component';
import { RoundScreenComponent } from './components/round-screen/round-screen.component';
import { RoundWinnerScreenComponent } from './components/round-winner-screen/round-winner-screen.component';
import { SetupScreenComponent } from './components/setup-screen/setup-screen.component';
import { TeamResultsScreenComponent } from './components/team-results-screen/team-results-screen.component';
import { StateEditorComponent } from './components/state-editor/state-editor.component';
import { RulesComponent } from './components/rules/rules.component';
import { tournamentGuard } from './guards/tournament.guard';
export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'tournament', component: TournamentComponent },
  { path: 'tournament/setup', component: SetupScreenComponent, canActivate: [tournamentGuard], data: { titleKey: 'pageTitle.setup' } },
  { path: 'tournament/teams', component: TeamsPageComponent, canActivate: [tournamentGuard], data: { titleKey: 'pageTitle.teams' } },
  { path: 'tournament/rules', component: RulesComponent, canActivate: [tournamentGuard], data: { titleKey: 'pageTitle.rules' } },
  { path: 'tournament/state', component: StateEditorComponent, data: { titleKey: 'pageTitle.state' } },
  { path: 'tournament/round/:roundNumber/play', component: RoundScreenComponent, canActivate: [tournamentGuard], data: { titleKey: 'pageTitle.roundTimer' } },
  { path: 'tournament/round/:roundNumber/scoring', redirectTo: 'tournament/round/:roundNumber/play', pathMatch: 'full' },
  { path: 'tournament/round/:roundNumber/round-winner', component: RoundWinnerScreenComponent, canActivate: [tournamentGuard], data: { titleKey: 'pageTitle.roundWinner' } },
  { path: 'tournament/results/:position', component: TeamResultsScreenComponent, canActivate: [tournamentGuard], data: { titleKey: 'pageTitle.teamResults' } },
  { path: 'credits', component: CreditsComponent, data: { titleKey: 'pageTitle.credits' } },
  { path: 'settings', component: SettingsComponent, data: { titleKey: 'pageTitle.settings' } },
  // Legacy redirects
  { path: 'setup', redirectTo: 'tournament/setup', pathMatch: 'full' },
  { path: 'teams', redirectTo: 'tournament/teams', pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];

