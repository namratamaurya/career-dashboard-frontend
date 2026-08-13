import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { AppShellComponent } from './shared/components/app-shell.component';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    component: AppShellComponent,
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'companies',
        loadComponent: () => import('./features/companies/companies.component').then((m) => m.CompaniesComponent),
      },
      {
        path: 'applications',
        loadComponent: () => import('./features/applications/applications.component').then((m) => m.ApplicationsComponent),
      },
      {
        path: 'saved-searches',
        loadComponent: () => import('./features/saved-searches/saved-searches.component').then((m) => m.SavedSearchesComponent),
      },
      {
        path: 'settings',
        loadComponent: () => import('./features/settings/settings.component').then((m) => m.SettingsComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'dashboard' },
];
