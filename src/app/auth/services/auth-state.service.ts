import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class AuthStateService {

  accessToken = signal<string | null>(null);
  csrfToken = signal<string | null>(null);
  user = signal<{ id?: string; email?: string; role?: string } | null>(null);

  setSession(access: string, csrf: string, user?: any) {
    this.accessToken.set(access);
    this.csrfToken.set(csrf);
    this.user.set(user ?? null);
  }
  clearSession() {
    this.accessToken.set(null);
    this.csrfToken.set(null);
    this.user.set(null);
  }
  isAuthenticated() {
    return !!this.accessToken();
  }

  constructor() { }

}
