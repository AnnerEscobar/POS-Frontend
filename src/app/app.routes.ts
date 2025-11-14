import { Routes } from '@angular/router';
import { authGuard } from './auth/guards/auth.guard';
import { publicGuard } from './auth/guards/public.guard';

export const routes: Routes = [

  {
    path: 'login', loadComponent: () => import('./auth/pages/login/auth.component'),
    canActivate: [publicGuard],
  },
  {
    //path principal del home
    path: 'home', loadComponent: () => import('./layouts/home-layout/home-layout.component'),
    canActivate: [authGuard],
    children: [
      {
        //path principal del inventario
        path: 'inventory', loadComponent: () => import('./inventory/inventario.component'),
      },
      {
        //path principal de los movimientos
        path: 'movimientos', loadComponent: () => import('./movimientos/movimientos.component'),
      },
      {
        path: 'sales', loadComponent: () => import('./sales/sales.component'),
      },
    ]
  },
  {
    path: '', pathMatch: 'full', redirectTo: 'home'
  },
  { path: '**', redirectTo: 'home' },
];
