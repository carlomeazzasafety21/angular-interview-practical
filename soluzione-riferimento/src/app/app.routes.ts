import { Routes } from '@angular/router';
import { authGuard } from './core/auth.guard';

export const routes: Routes = [
  { path: 'login', loadComponent: () => import('./features/login/login').then((m) => m.Login) },
  {
    path: '',
    canActivate: [authGuard],
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'tickets' },
      { path: 'tickets', loadComponent: () => import('./features/tickets/ticket-list').then((m) => m.TicketList) },
      { path: 'tickets/new', loadComponent: () => import('./features/tickets/ticket-form').then((m) => m.TicketForm) },
      { path: 'tickets/:id', loadComponent: () => import('./features/tickets/ticket-detail').then((m) => m.TicketDetail) },
      { path: 'tickets/:id/edit', loadComponent: () => import('./features/tickets/ticket-form').then((m) => m.TicketForm) },
      { path: 'stats', loadComponent: () => import('./features/stats/stats').then((m) => m.StatsPage) },
    ],
  },
  { path: '**', redirectTo: '' },
];
