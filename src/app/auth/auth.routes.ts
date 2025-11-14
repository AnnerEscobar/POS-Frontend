import { Routes } from "@angular/router";
import AuthComponent from "./pages/login/auth.component";
import { publicGuard } from "./guards/public.guard";

export const authRoutes: Routes = [
  {
    path: 'login',
    canActivate: [publicGuard],
    component: AuthComponent,
  },
];
