import { Routes } from "@angular/router";
import AuthComponent from "./pages/login/auth.component";
import { PublicGuard } from "./guards/public.guard";

export const authRoutes: Routes = [
  {
    path: 'login',
    canActivate: [PublicGuard],
    component: AuthComponent,
  },
];
