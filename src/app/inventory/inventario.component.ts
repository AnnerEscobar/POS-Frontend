import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMenuModule } from '@angular/material/menu';
import { computed, signal } from '@angular/core';
import { MatSidenavModule } from '@angular/material/sidenav';
import { Router } from '@angular/router';

type Product = {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  image?: string | null;
  category?: string;
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
    MatTabsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatMenuModule,
    MatIconModule,
    MatDatepickerModule,
    MatTableModule,
    MatSidenavModule,
  ]
})
export default class InventarioComponent implements OnInit {

  private fb = inject(FormBuilder);
  private router = inject(Router);

  // Mock data (con categorías)
  data = signal<Product[]>([
    { id: '1', name: 'Bocina JBL 700XL', price: 365, cost: 300, stock: 1, image: 'https://tse2.mm.bing.net/th/id/OIP.-kiFsy6zqhmiOwWqzruDDgHaEy?cb=ucfimgc2&rs=1&pid=ImgDetMain&o=7&rm=3', category: 'Bocinas' },
    { id: '2', name: 'Folder Manila T/oficio', price: 1, cost: 0.5, stock: 74, image: 'https://tse2.mm.bing.net/th/id/OIP.kE1FXQ9mANs0NjkW4eXBkAHaHa?cb=ucfimgc2&rs=1&pid=ImgDetMain&o=7&rm=3', category: 'Papelería' },
    { id: '3', name: 'Cartulina', price: 2.5, cost: 1, stock: 25, image: 'https://cafesacomercial.com/wp-content/uploads/2023/03/cartulina-blanca-22-27.jpg', category: 'Papelería' },
    { id: '4', name: 'Adaptador Ethernet', price: 35, cost: 20, stock: 4, image: 'https://tse2.mm.bing.net/th/id/OIP.DgUUcV3TeGKvFSYHfqtfzAHaHn?cb=ucfimgc2&rs=1&pid=ImgDetMain&o=7&rm=3', category: 'Informatica' },
    { id: '5', name: 'USB', price: 50, cost: 15, stock: 0, image:'https://tse4.mm.bing.net/th/id/OIP.oZY6U7RYT2hp29UC5tM6VgHaHa?cb=ucfimgc2&rs=1&pid=ImgDetMain&o=7&rm=3', category: 'Informatica' },
    { id: '6', name: 'Lapiz', price: 50, cost: 15, stock: 0, image: 'https://papershop.com.ec/wp-content/uploads/2020/08/LAPIZ-MONGOL.jpg', category: 'papeleria' },
  ]);

 // filtros / estado UI
  form = this.fb.group({ search: [''] });
  selectedCategory = signal<string | null>(null);
  selectedStockFilter = signal<StockFilter>('all');  // 🔹 nuevo
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
    const f  = this.selectedStockFilter();

    return this.data().filter(p => {
      const byText  = !q || p.name.toLowerCase().includes(q);
      const byCat   = !cat || p.category === cat;
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
  applySearch() { /* hook para buscar en API */ }

    // 🔹 Filtro de stock
  selectStockFilter(f: StockFilter) {
    // si ya está seleccionado, togglear a 'all'
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

  // ediciones inline
  setPrice(p: Product, v: number) { p.price = Number(v) || 0; this.data.set([...this.data()]); }
  setCost(p: Product, v: number) { p.cost = Number(v) || 0; this.data.set([...this.data()]); }
  setStock(p: Product, v: number) { p.stock = Number(v) || 0; this.data.set([...this.data()]); }

  // ganancias
  profitAmount = (p: Product) => (p.price - p.cost);
  profitPercent = (p: Product) => p.price ? ((p.price - p.cost) / p.price) * 100 : 0;

  constructor() { }

  ngOnInit() {
  }

}
