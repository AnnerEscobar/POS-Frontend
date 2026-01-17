import { HttpClient } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';

export interface AuthUser {
  id: string;
  tenantId: string;  
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


  private http = inject(HttpClient); // por si lo necesitas luego
  // private api = 'http://localhost:3000';

  user = signal<AuthUser | null>(null);
  accessToken = signal<string | null>(null);
  refreshToken = signal<string | null>(null); // SOLO memoria

  constructor() {
    // 🔹 Restaurar desde sessionStorage al recargar
    const token = sessionStorage.getItem('accessToken');
    const userStr = sessionStorage.getItem('user');

    if (token) {
      this.accessToken.set(token);
    }

    if (userStr) {
      try {
        this.user.set(JSON.parse(userStr));
      } catch {
        sessionStorage.removeItem('user');
      }
    }
  }

  setSession(res: LoginResponse) {
    this.user.set(res.user);
    this.accessToken.set(res.accessToken);
    this.refreshToken.set(res.refreshToken);

    // 🔹 Guardamos solo lo necesario
    sessionStorage.setItem('accessToken', res.accessToken);
    sessionStorage.setItem('user', JSON.stringify(res.user));
  }

  updateTokens(accessToken: string, refreshToken: string) {
    this.accessToken.set(accessToken);
    this.refreshToken.set(refreshToken);

    sessionStorage.setItem('accessToken', accessToken);
  }

  clear() {
    this.user.set(null);
    this.accessToken.set(null);
    this.refreshToken.set(null);

    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!this.accessToken();
  }
}
