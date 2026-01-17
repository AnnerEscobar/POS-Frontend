import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthStateService } from '../services/auth-state.service';
import { AuthService } from '../services/auth.service';
import { catchError, switchMap, throwError } from 'rxjs';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {

    // ✅ NO interceptar rutas de auth para evitar loops (refresh/logout/login)
  if (req.url.includes('/auth/')) {
    return next(req);
  }

  const state = inject(AuthStateService);
  const auth = inject(AuthService);
  const accessToken = state.accessToken();

  let cloned = req;

  if (accessToken) {
    cloned = req.clone({
      setHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
  }

  return next(cloned).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status !== 401) {
        return throwError(() => error);
      }

      const refreshToken = state.refreshToken();

      // si no hay forma de refrescar, cerramos sesión
      if (!refreshToken || isRefreshing) {
        auth.logout();
        return throwError(() => error);
      }

      isRefreshing = true;

      return auth.refresh().pipe(
        switchMap(() => {
          isRefreshing = false;
          const newAccess = state.accessToken();
          const retryReq = req.clone({
            setHeaders: {
              Authorization: newAccess ? `Bearer ${newAccess}` : '',
            },
          });
          return next(retryReq);
        }),
        catchError(err => {
          isRefreshing = false;
          auth.logout();
          return throwError(() => err);
        })
      );
    })
  );
};
