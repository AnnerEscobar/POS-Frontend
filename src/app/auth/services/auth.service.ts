import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';
import { AuthStateService, LoginResponse } from './auth-state.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private state = inject(AuthStateService);

  private api = 'http://localhost:3000'; // o usa environment

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.api}/auth/login`, { email, password })
      .pipe(
        tap(res => {
          this.state.setSession(res);
        })
      );
  }

  refresh() {
    const user = this.state.user();
    const refreshToken = this.state.refreshToken();

    if (!user || !refreshToken) {
      throw new Error('No refresh info');
    }

    return this.http
      .post<{ accessToken: string; refreshToken: string }>(
        `${this.api}/auth/refresh`,
        { userId: user.id, refreshToken }
      )
      .pipe(
        tap(tokens => {
          this.state.updateTokens(tokens.accessToken, tokens.refreshToken);
        })
      );
  }

  logout() {
    // Avisamos al backend pero no esperamos respuesta
    this.http.post(`${this.api}/auth/logout`, {}).subscribe({
      error: () => {},
    });

    this.state.clear();
    this.router.navigateByUrl('/login');
  }
}
