import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { CreateProductDto } from '../interfaces/create-product-dto.interface';

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

@Injectable({ providedIn: 'root' })
export class InventoryService {
  private http = inject(HttpClient);

  // Ajusta según tu backend:
  // - Si NO usas prefix 'api' -> 'http://localhost:3000'
  // - Si usas app.setGlobalPrefix('api') -> 'http://localhost:3000/api'
  private api = 'http://localhost:3000';

  createProduct(dto: CreateProductDto): Observable<Product> {
    return this.http.post<Product>(`${this.api}/product`, dto);
  }

  // Más adelante aquí agregaremos getProducts(), updateProduct(), etc.

  getProducts() {
    return this.http.get<{
      items: Product[];
      total: number;
      page: number;
      limit: number;
    }>(`${this.api}/product`);
  }


}
