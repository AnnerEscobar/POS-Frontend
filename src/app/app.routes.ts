import { Routes } from '@angular/router';

export const routes: Routes = [

  {
    path: 'login', loadComponent: () => import('./auth/auth/auth.component')
  },
  {
    //path principal del home
    path: 'home', loadComponent: () => import('./layouts/home-layout/home-layout.component'),
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
    path: '', redirectTo: 'home', pathMatch: 'full'
  },

];
