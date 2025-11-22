// src/app/services/category.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environments';
import { Category } from '../interfaces/category';

@Injectable({ providedIn: 'root' })
export class CategoryService {
  private http = inject(HttpClient);
  private api = environment.apiUrl;

  // 🔹 Obtener categorías desde el backend
  getCategories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.api}/categories`);
  }

  // 🔹 Crear categoría en la DB (si la quieres usar desde el botón "Agregar")
  createCategory(name: string): Observable<Category> {
    return this.http.post<Category>(`${this.api}/categories`, { name });
  }
}
