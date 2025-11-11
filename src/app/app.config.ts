import { ApplicationConfig, inject, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideNativeDateAdapter, MAT_DATE_LOCALE } from '@angular/material/core';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor, AuthService } from './auth';
import { fakeBackendInterceptor } from './auth/interceptors/fake-backend.interceptor';


// Intenta refrescar sesión al boot (ignora errores)
function initAuth() {
  return () => {
    const auth = inject(AuthService);
    return auth.refresh().toPromise().catch(() => void 0);
  };
}


export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideNativeDateAdapter(),{ provide: MAT_DATE_LOCALE, useValue: 'es' },
    provideHttpClient(withInterceptors([authInterceptor, fakeBackendInterceptor]))
  ]
};
