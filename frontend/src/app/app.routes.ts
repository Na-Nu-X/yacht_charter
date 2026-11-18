import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    title: 'Prenájom jácht a námorné plavby',
    loadComponent: () => import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'flotila',
    title: 'Flotila jácht',
    loadComponent: () => import('./pages/fleet/fleet.component').then((m) => m.FleetComponent),
  },
  {
    path: 'flotila/:slug',
    title: 'Detail jachty',
    loadComponent: () =>
      import('./pages/yacht-detail/yacht-detail.component').then((m) => m.YachtDetailComponent),
  },
  {
    path: 'destinacie',
    title: 'Destinácie a maríny',
    loadComponent: () =>
      import('./pages/destinations/destinations.component').then((m) => m.DestinationsComponent),
  },
  {
    path: 'plavba-na-mieru',
    title: 'Plavba na mieru',
    loadComponent: () =>
      import('./pages/custom-charter/custom-charter.component').then((m) => m.CustomCharterComponent),
  },
  {
    path: 'o-nas-a-kontakt',
    title: 'Ako to funguje a kontakt',
    loadComponent: () =>
      import('./pages/about-contact/about-contact.component').then((m) => m.AboutContactComponent),
  },
  {
    path: '**',
    title: 'Stránka nenájdená',
    loadComponent: () =>
      import('./pages/not-found/not-found.component').then((m) => m.NotFoundComponent),
  },
];
