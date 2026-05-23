import { Route } from '@angular/router';

export const appRoutes: Route[] = [
  { 
    path: 'login', 
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent) 
  },
  { 
    path: '', 
    loadComponent: () => import('./layout/layout.component').then(m => m.LayoutComponent),
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent) },
      { path: 'users', loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
