import { Component, inject, OnInit, computed, signal } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';


import {
  InventoryService,
  Product as BackendProduct,
  StockStatus,
} from './services/inventory.service';

type Product = {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  image?: string | null;
  category?: string | null;
};

type StockFilter = StockStatus; // 'all' | 'low' | 'out'

@Component({
  standalone: true,
  selector: 'app-inventario',
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css'],
  imports: [
    CommonModule,
    NgFor,
    NgIf,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatIconModule,
    MatTableModule,
    MatSidenavModule,
    MatPaginatorModule,
  ],
})
export default class InventarioComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private inventory: InventoryService = inject(InventoryService);

  // Datos que vienen del backend (ya filtrados por categoría/stock)
  data = signal<Product[]>([]);

  // filtros / estado UI
  form = this.fb.group({ search: [''] });
  selectedCategory = signal<string | null>(null);
  selectedStockFilter = signal<StockFilter>('all');
  drawerOpened = false;

  // métricas de stock (sobre el dataset cargado actualmente)
  lowStockCount = computed(() =>
    this.data().filter((p) => p.stock === 1 || p.stock === 2).length
  );

  outOfStockCount = computed(() =>
    this.data().filter((p) => p.stock === 0).length
  );

  categories = computed(() => {
    const set = new Set(
      this.data()
        .map((p) => p.category)
        .filter(Boolean) as string[]
    );
    return Array.from(set);
  });

  // AHORA filtered() solo aplica búsqueda de texto sobre los datos ya filtrados por backend
  filtered = computed(() => this.data());

  cols = ['product', 'price', 'cost', 'stock', 'profit'];

   // 🔹 Paginación con MatPaginator
  pageIndex = signal(0);     // índice de página (0 = primera)
  pageSize = signal(5);     // cuantos productos por página

  paged = computed(() => {
    const data = this.filtered();
    const start = this.pageIndex() * this.pageSize();
    const end = start + this.pageSize();
    return data.slice(start, end);
  });

  // opcional: para mostrar rango "Mostrando X - Y de Z"
  pageStart = computed(() => {
    const total = this.filtered().length;
    if (total === 0) return 0;
    return this.pageIndex() * this.pageSize() + 1;
  });

  pageEnd = computed(() => {
    const total = this.filtered().length;
    const end = (this.pageIndex() + 1) * this.pageSize();
    return end > total ? total : end;
  });

  onPageChange(event: PageEvent) {
    this.pageIndex.set(event.pageIndex);
    this.pageSize.set(event.pageSize);
  }
    // cuantos productos por página

  totalCost = computed(() =>
    this.data().reduce((a, c) => a + c.cost * c.stock, 0)
  );

  // acciones
  openCategories() {
    this.drawerOpened = true;
  }

  createProduct() {
    this.router.navigate(['/home/inventory/add-product']);
  }

  selectCategory(c: string | null) {
    this.selectedCategory.set(c);
    this.pageIndex.set(0);
    this.loadProducts(); // recargar desde backend con la nueva categoría
  }

  applySearch() {
    const q = (this.form.value.search || '').toString();
    this.pageIndex.set(0);
    this.loadProducts(q);
  }

  selectStockFilter(f: StockFilter) {
    if (this.selectedStockFilter() === f) {
      // si clickea de nuevo, volvemos a 'all'
      this.selectedStockFilter.set('all');
    } else {
      this.selectedStockFilter.set(f);
    }
    this.pageIndex.set(0);
    this.loadProducts(); // recargar desde backend con nuevo stockStatus
  }

  clearAllFilters() {
    this.selectedCategory.set(null);
    this.selectedStockFilter.set('all');
    this.form.patchValue({ search: '' });
    this.pageIndex.set(0);
    this.loadProducts();
  }

  // ediciones inline (por ahora sólo en UI; luego las mandaremos al backend)
  setPrice(p: Product, v: number) {
    p.price = Number(v) || 0;
    this.data.set([...this.data()]);
  }

  setCost(p: Product, v: number) {
    p.cost = Number(v) || 0;
    this.data.set([...this.data()]);
  }

  setStock(p: Product, v: number) {
    p.stock = Number(v) || 0;
    this.data.set([...this.data()]);
  }

  // ganancias
  profitAmount = (p: Product) => p.price - p.cost;
  profitPercent = (p: Product) =>
    p.price ? ((p.price - p.cost) / p.price) * 100 : 0;

  constructor() { }

  ngOnInit() {
    this.loadProducts();
  }

  private loadProducts(search?: string) {
    const category = this.selectedCategory();
    const stockStatus = this.selectedStockFilter();
    const q = (search ?? this.form.value.search ?? '').toString();

    this.inventory
      .getProducts({
        category: category,
        stockStatus: stockStatus,
        search: q,
        page: 1,
        limit: 1000, // por ahora un límite alto
      })
      .subscribe({
        next: (res: { items: BackendProduct[]; total: number; page: number; limit: number }) => {
          const products: BackendProduct[] = res.items || [];

          const mapped: Product[] = products.map((p) => ({
            id: p._id,
            name: p.name,
            price: p.price,
            cost: p.cost,
            stock: p.stock,
            image: p.image,
            category: p.category,
          }));

          this.data.set(mapped);
        },
        error: (err) => {
          console.error('Error cargando productos:', err);
        },
      });
  }


}
