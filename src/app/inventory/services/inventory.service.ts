import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateProductDto } from '../interfaces/create-product-dto.interface';
import { environment } from '../../../environments/environments';

// Si tienes environments, usa environment.apiUrl
// import { environment } from '../../environments/environment';

export interface Product {
  _id: string;
  name: string;
  code: string | null;
  stock: number;
  price: number;
  cost: number;
  category: string | null;
  description: string | null;
  showOnline: boolean;
  image: string | null;
  createdAt: string;
  updatedAt: string;
}

// 🔹 DEFINE y EXPORTA el tipo aquí
export type StockStatus = 'all' | 'low' | 'out';

@Injectable({ providedIn: 'root' })
export class InventoryService {

  private http = inject(HttpClient);


  // Ajusta según tu backend:
  // - Si NO usas prefix 'api' -> 'http://localhost:3000'
  // - Si usas app.setGlobalPrefix('api') -> 'http://localhost:3000/api'
  private api = environment.apiUrl;

  createProduct(dto: CreateProductDto): Observable<Product> {
    return this.http.post<Product>(`${this.api}/product`, dto);
  }

  // Más adelante aquí agregaremos getProducts(), updateProduct(), etc.

  getProducts(options?: {
    category?: string | null;
    stockStatus?: StockStatus;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    let params = new HttpParams();

    if (options?.category) {
      params = params.set('category', options.category);
    }

    if (options?.stockStatus && options.stockStatus !== 'all') {
      params = params.set('stockStatus', options.stockStatus);
    }

    if (options?.search && options.search.trim() !== '') {
      params = params.set('search', options.search.trim());
    }

    if (options?.page) {
      params = params.set('page', options.page.toString());
    }

    if (options?.limit) {
      params = params.set('limit', options.limit.toString());
    }

    return this.http.get<{
      items: Product[];
      total: number;
      page: number;
      limit: number;
    }>(`${this.api}/product`, { params });
  }

  // 🔹 UPDATE RÁPIDO (tabla: precio, costo, stock)
  quickUpdateProduct(id: string, dto: any) {
    return this.http.patch<Product>(`${this.api}/product/quick/${id}`, dto);
  }

  updateProduct(id: string, dto: any) {
    console.log('Updating product with DTO:', dto);
    return this.http.patch<Product>(`${this.api}/product/${id}`, dto);

  }


}
