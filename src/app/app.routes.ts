import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { CreditsComponent } from './components/credits/credits.component';
import { SettingsComponent } from './components/settings/settings.component';
import { TeamsPageComponent } from './components/teams-page/teams-page.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'teams', component: TeamsPageComponent, data: { titleKey: 'pageTitle.teams' } },
  { path: 'credits', component: CreditsComponent, data: { titleKey: 'pageTitle.credits' } },
  { path: 'settings', component: SettingsComponent, data: { titleKey: 'pageTitle.settings' } },
  { path: '**', redirectTo: '' }
];
