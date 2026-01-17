import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'transferencia' | 'mixto';

/** Lo que mandas al backend en cada item al crear la venta */
export interface SaleItemPayload {
  productId?: string | null; // ✅ ahora opcional
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  code?: string | null;
}


/** Payload que usas para crear una venta */
export interface CreateSalePayload {
  date?: string; // opcional
  items: SaleItemPayload[];
  total: number;
  customer?: {
    name?: string | null;
    nit?: string | null;
  };
  payment: {
    method: PaymentMethod;
    paid: number;
    change: number;
  };
}

/** ---- Nuevas interfaces para leer una venta desde el backend ---- */

export interface SaleItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  code?: string | null;
}

export interface SaleCustomer {
  name: string | null;
  nit: string | null;
}

export interface SalePayment {
  method: PaymentMethod;
  paid: number;
  change: number;
}

export interface Sale {
  _id: string;           // 👈 ID principal
  date?: string;
  createdAt?: string;
  items: SaleItem[];
  subtotal?: number;
  discount?: number;
  total: number;
  customer?: {
    name?: string | null;
    nit?: string | null;
    _id?: string;
  };
  payment?: {
    method: PaymentMethod;
    paid: number;
    change: number;
    _id?: string;
  };
  fel?: {
    certified: boolean;
    uuid?: string | null;
    serie?: string | null;
    numero?: string | null;
    pdfUrl?: string | null;
  };
}


@Injectable({ providedIn: 'root' })
export class SalesService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  /** Crear venta */
  createSale(payload: CreateSalePayload): Observable<Sale> {
    console.log('Creating sale with payload:', payload);
    return this.http.post<Sale>(`${this.api}/sales`, payload);
  }


  /** Obtener venta por ID para el ticket */
  getSaleById(id: string): Observable<Sale> {
    return this.http.get<Sale>(`${this.api}/sales/${id}`);
  }

  // más adelante: getSales(), etc.

  getSales(params: { from?: string; to?: string; search?: string }): Observable<Sale[]> {
    let httpParams = new HttpParams();

    if (params.from) httpParams = httpParams.set('from', params.from);
    if (params.to) httpParams = httpParams.set('to', params.to);
    if (params.search && params.search.trim()) {
      httpParams = httpParams.set('search', params.search.trim());
    }

    return this.http.get<Sale[]>(`${this.api}/sales`, { params: httpParams });
  }
}
