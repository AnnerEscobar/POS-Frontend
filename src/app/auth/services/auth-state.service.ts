import { Injectable, signal } from '@angular/core';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: string;
}

export interface LoginResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

@Injectable({ providedIn: 'root' })
export class AuthStateService {
  user = signal<AuthUser | null>(null);
  accessToken = signal<string | null>(null);
  refreshToken = signal<string | null>(null);

  setSession(res: LoginResponse) {
    this.user.set(res.user);
    this.accessToken.set(res.accessToken);
    this.refreshToken.set(res.refreshToken);
  }

  updateTokens(accessToken: string, refreshToken: string) {
    this.accessToken.set(accessToken);
    this.refreshToken.set(refreshToken);
  }

  clear() {
    this.user.set(null);
    this.accessToken.set(null);
    this.refreshToken.set(null);
  }

  isAuthenticated() {
    return !!this.accessToken();
  }
}
