import { Routes } from '@angular/router';

import { Dashboard } from './pages/dashboard/dashboard';
import { EstablishmentHome } from './pages/establishment-home/establishment-home';
import { authGuard, roleGuard } from './guards/role.guard';
import { Landing } from './pages/landing/landing';
import { Login } from './pages/login/login';
import { LogisticsHome } from './pages/logistics-home/logistics-home';
import { Marketplace } from './pages/marketplace/marketplace';
import { Notifications } from './pages/notifications/notifications';
import { Profile } from './pages/profile/profile';

export const routes: Routes = [
  {
    path: '',
    component: Landing,
  },
  {
    path: 'admin',
    component: Dashboard,
    canActivate: [roleGuard(['Administrador'])],
  },
  {
    path: 'login',
    component: Login,
  },
  {
    path: 'cliente',
    component: Marketplace,
    canActivate: [roleGuard(['Cliente', 'Administrador'])],
  },
  {
    path: 'establecimiento',
    component: EstablishmentHome,
    canActivate: [roleGuard(['Establecimiento', 'Administrador'])],
  },
  {
    path: 'logistica',
    component: LogisticsHome,
    canActivate: [roleGuard(['Usuario Logistico', 'Logistica', 'Administrador'])],
  },
  {
    path: 'perfil',
    component: Profile,
    canActivate: [authGuard],
  },
  {
    path: 'notificaciones',
    component: Notifications,
    canActivate: [authGuard],
  },
  {
    path: 'register-business',
    loadComponent: () =>
      import('./pages/register-business/register-business')
        .then(c => c.RegisterBusiness)
  }
];
