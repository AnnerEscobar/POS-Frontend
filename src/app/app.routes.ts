import { Routes } from '@angular/router';
import { AuthGuard, PublicGuard } from './auth';

export const routes: Routes = [

  {
    path: 'login', loadComponent: () => import('./auth/pages/login/auth.component'),
    canActivate: [PublicGuard],
  },
  {
    //path principal del home
    path: 'home', loadComponent: () => import('./layouts/home-layout/home-layout.component'),
    canActivate: [AuthGuard],
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
    path: '', pathMatch: 'full',redirectTo: 'home/inventory'
  },
  { path: '**', redirectTo: 'home/inventory' },
];
