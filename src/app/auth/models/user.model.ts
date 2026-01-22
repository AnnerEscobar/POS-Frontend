// src/app/auth/user.model.ts
export interface CurrentUser {
  id: string;
  name: string;
  role: 'ADMIN' | 'CAJERO' | 'SUPERVISOR' | string;
}
