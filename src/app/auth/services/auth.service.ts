import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { AuthStateService } from './auth-state.service';
import { Observable, tap } from 'rxjs';


type LoginResponse = { accessToken: string; csrfToken: string; user?: any };
type RefreshResponse = { accessToken: string; csrfToken: string };

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // cambia a tu baseURL real cuando conectemos NestJS
  private base = '/auth';

  constructor(private http: HttpClient, private state: AuthStateService) { }

  login(email: string, password: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.base}/login`, { email, password }, { withCredentials: true })
      .pipe(tap(res => this.state.setSession(res.accessToken, res.csrfToken, res.user)));
  }

  refresh(): Observable<RefreshResponse> {
    return this.http.post<RefreshResponse>(`${this.base}/refresh`, {}, { withCredentials: true })
      .pipe(tap(res => this.state.setSession(res.accessToken, res.csrfToken, this.state.user())));
  }

  logout() {
    return this.http.post(`${this.base}/logout`, {}, { withCredentials: true })
      .pipe(tap(() => this.state.clearSession()));
  }


}
