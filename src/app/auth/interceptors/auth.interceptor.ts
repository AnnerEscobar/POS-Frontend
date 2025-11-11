import { HttpBackend, HttpClient, HttpErrorResponse, HttpHandlerFn, HttpRequest, type HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError, tap, switchMap } from 'rxjs';
import { AuthStateService } from '../services/auth-state.service';

export const authInterceptor: HttpInterceptorFn = (req: HttpRequest<any>, next: HttpHandlerFn) => {
  const state = inject(AuthStateService);
  const httpBackend = inject(HttpBackend);
  const bareHttp = new HttpClient(httpBackend); // evita recursión del interceptor

  let headers: { [k: string]: string } = {};
  if (state.accessToken()) headers['Authorization'] = `Bearer ${state.accessToken()}`;
  if (state.csrfToken()) headers['X-CSRF-Token'] = state.csrfToken()!;

  const authReq = req.clone({ setHeaders: headers, withCredentials: true });

  return next(authReq).pipe(
    catchError((err: HttpErrorResponse) => {
      if (err.status !== 401) return throwError(() => err);

      // intentar un refresh usando el cliente "bare"
      return bareHttp.post<{ accessToken: string; csrfToken: string }>(
        '/auth/refresh', {}, { withCredentials: true }
      ).pipe(
        tap(({ accessToken, csrfToken }) => state.setSession(accessToken, csrfToken, state.user())),
        switchMap(() => {
          const retried = req.clone({
            setHeaders: {
              ...(state.accessToken() ? { Authorization: `Bearer ${state.accessToken()}` } : {}),
              ...(state.csrfToken() ? { 'X-CSRF-Token': state.csrfToken()! } : {}),
            },
            withCredentials: true,
          });
          return next(retried);
        }),
        catchError(refreshErr => throwError(() => refreshErr))
      );
    })
  );
};
