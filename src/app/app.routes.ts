import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { CreditsComponent } from './components/credits/credits.component';
import { SettingsComponent } from './components/settings/settings.component';
import { TeamsPageComponent } from './components/teams-page/teams-page.component';
import { RoundScreenComponent } from './components/round-screen/round-screen.component';
import { ScoringScreenComponent } from './components/scoring-screen/scoring-screen.component';
import { RoundWinnerScreenComponent } from './components/round-winner-screen/round-winner-screen.component';
import { SetupScreenComponent } from './components/setup-screen/setup-screen.component';
import { FinishedScreenComponent } from './components/finished-screen/finished-screen.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'setup', component: SetupScreenComponent, data: { titleKey: 'pageTitle.setup' } },
  { path: 'round/:roundNumber/timer', component: RoundScreenComponent, data: { titleKey: 'pageTitle.roundTimer' } },
  { path: 'round/:roundNumber/scoring', component: ScoringScreenComponent, data: { titleKey: 'pageTitle.scoring' } },
  { path: 'round/:roundNumber/round-winner', component: RoundWinnerScreenComponent, data: { titleKey: 'pageTitle.roundWinner' } },
  { path: 'finished', component: FinishedScreenComponent, data: { titleKey: 'pageTitle.finished' } },
  { path: 'teams', component: TeamsPageComponent, data: { titleKey: 'pageTitle.teams' } },
  { path: 'credits', component: CreditsComponent, data: { titleKey: 'pageTitle.credits' } },
  { path: 'settings', component: SettingsComponent, data: { titleKey: 'pageTitle.settings' } },
  { path: '**', redirectTo: '' }
];
