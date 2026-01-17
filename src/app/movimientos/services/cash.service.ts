import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

// Ajusta esto según tu proyecto
const apiUrl = environment.apiUrl;  // o environment.apiUrl

export interface CashRegister {
  _id: string;
  tenantId: string; // ✅ antes businessId
  userId: string;
  initialAmount: number;
  closingAmount?: number;
  expectedAmount?: number;
  difference?: number;
  status: 'open' | 'closed';
  openingTime: string;
  closingTime?: string;
  notes?: string;
}


@Injectable({
  providedIn: 'root',
})
export class CashService {
  private http = inject(HttpClient);

  getStatus(): Observable<CashRegister | null> {
    console.log('Log de la url consultada', `${apiUrl}/cash/status`);
    return this.http.get<CashRegister | null>(`${apiUrl}/cash/status`);
  }

  openCash(payload: { initialAmount: number; notes?: string }): Observable<CashRegister> {
    return this.http.post<CashRegister>(`${apiUrl}/cash/open`, payload);
  }

  closeCash(payload: { closingAmount: number }): Observable<CashRegister> {
    return this.http.post<CashRegister>(`${apiUrl}/cash/close`, payload);
  }
}
