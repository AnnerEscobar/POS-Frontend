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

import { InventoryService, Product as BackendProduct } from './services/inventory.service';

type Product = {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  image?: string | null;
  category?: string | null;
};

type StockFilter = 'all' | 'low' | 'out';

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
  ]
})
export default class InventarioComponent implements OnInit {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private inventory = inject(InventoryService);

  // Data proveniente del backend
  data = signal<Product[]>([]);

  // filtros / estado UI
  form = this.fb.group({ search: [''] });
  selectedCategory = signal<string | null>(null);
  selectedStockFilter = signal<StockFilter>('all');
  drawerOpened = false;

  // métricas de stock
  lowStockCount = computed(() =>
    this.data().filter(p => p.stock === 1 || p.stock === 2).length
  );

  outOfStockCount = computed(() =>
    this.data().filter(p => p.stock === 0).length
  );

  categories = computed(() => {
    const set = new Set(this.data().map(p => p.category).filter(Boolean) as string[]);
    return Array.from(set);
  });

  filtered = computed(() => {
    const q = (this.form.value.search || '').toString().toLowerCase().trim();
    const cat = this.selectedCategory();
    const f = this.selectedStockFilter();

    return this.data().filter(p => {
      const byText = !q || p.name.toLowerCase().includes(q);
      const byCat = !cat || p.category === cat;
      const byStock =
        f === 'all'
          ? true
          : f === 'low'
            ? (p.stock === 1 || p.stock === 2)
            : (p.stock === 0); // 'out'
      return byText && byCat && byStock;
    });
  });

  cols = ['product', 'price', 'cost', 'stock', 'profit'];

  totalCost = computed(() =>
    this.data().reduce((a, c) => a + (c.cost * c.stock), 0)
  );

  // acciones
  openCategories() { this.drawerOpened = true; }
  createProduct() { this.router.navigate(['/home/inventory/add-product']); }

  selectCategory(c: string | null) { this.selectedCategory.set(c); }
  applySearch() { /* más adelante: buscar en API si quieres */ }

  selectStockFilter(f: StockFilter) {
    if (this.selectedStockFilter() === f) {
      this.selectedStockFilter.set('all');
    } else {
      this.selectedStockFilter.set(f);
    }
  }

  clearAllFilters() {
    this.selectedCategory.set(null);
    this.selectedStockFilter.set('all');
    this.form.patchValue({ search: '' });
  }

  // ediciones inline (por ahora solo front, luego las mandamos al backend)
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
  profitAmount = (p: Product) => (p.price - p.cost);
  profitPercent = (p: Product) => p.price ? ((p.price - p.cost) / p.price) * 100 : 0;

  constructor() { }

  ngOnInit() {
    this.loadProducts();
  }

  private loadProducts() {
    this.inventory.getProducts().subscribe({
      next: (res) => {
        const products: BackendProduct[] = res.items || [];

        const mapped: Product[] = products.map(p => ({
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
