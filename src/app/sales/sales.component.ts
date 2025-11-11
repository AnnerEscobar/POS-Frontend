import { Component, OnInit } from '@angular/core';
import { computed, inject, signal } from '@angular/core';
import { CommonModule, CurrencyPipe, NgFor, NgIf } from '@angular/common';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { MatChipsModule } from '@angular/material/chips';

type Product = {
  id: string;
  name: string;
  price: number;
  stock?: number;
  image?: string | null;
  category?: string;
};

type CartItem = Product & { qty: number };

@Component({
  selector: 'app-sales',
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css'],
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatIconModule, MatFormFieldModule, MatInputModule,
    MatCardModule, MatDividerModule, MatBadgeModule, MatTooltipModule, MatMenuModule, MatChipsModule,
    NgIf, NgFor
  ]
})
export default class SalesComponent implements OnInit {

  private fb = inject(FormBuilder);

  form = this.fb.group({
    search: ['']
  });

  // Mock productos con categorías (reemplaza por servicio real)
  products: Product[] = [
    { id: 'p1', name: 'Folder', price: 1,   stock: 86, category: 'Papelería' },
    { id: 'p2', name: 'Cuaderno', price: 12.5, stock: 20, category: 'Papelería' },
    { id: 'p3', name: 'Lapicero', price: 3.25, stock: 100, category: 'Papelería' },
    { id: 'p4', name: 'Bocina JBL 700XL', price: 365, stock: 4, category: 'Electrónica' },
  ];

  // Categorías únicas
  categories = signal<string[]>([]);
  selectedCategory = signal<string | null>(null);

  // Canasta
  cart = signal<CartItem[]>([]);
  totalItems = computed(() => this.cart().reduce((a, c) => a + c.qty, 0));
  totalAmount = computed(() => this.cart().reduce((a, c) => a + c.qty * c.price, 0));

  constructor() {
    // inicializar categorías únicas
    const set = Array.from(new Set(this.products.map(p => p.category).filter(Boolean))) as string[];
    this.categories.set(set);
  }

  selectCategory(c: string | null) { this.selectedCategory.set(c); }

  filteredProducts() {
    const q = (this.form.value.search || '').toString().toLowerCase().trim();
    const cat = this.selectedCategory();
    return this.products.filter(p => {
      const byCat = !cat || p.category === cat;
      const byText = !q || p.name.toLowerCase().includes(q);
      return byCat && byText;
    });
  }

  applySearch() {/* hook para api */ }

  addToCart(p: Product) {
    const current = this.cart();
    const idx = current.findIndex(i => i.id === p.id);
    if (idx >= 0) current[idx] = { ...current[idx], qty: current[idx].qty + 1 };
    else current.push({ ...p, qty: 1 });
    this.cart.set([...current]);
  }
  countInCart(id: string) {
    const it = this.cart().find(i => i.id === id);
    return it ? it.qty : 0;
    }

  inc(it: CartItem) { it.qty++; this.cart.set([...this.cart()]); }
  dec(it: CartItem) { if (it.qty > 1) { it.qty--; this.cart.set([...this.cart()]); } else this.remove(it); }
  remove(it: CartItem) { this.cart.set(this.cart().filter(x => x.id !== it.id)); }
  clearCart() { this.cart.set([]); }

  createProduct() { console.log('crear producto'); }
  startFreeSale() { console.log('nueva venta libre'); }
  newExpense() { console.log('nuevo gasto'); }
  continue() { console.log('continuar', this.cart(), this.totalAmount()); }

  trackById = (_: number, r: CartItem) => r.id;

  ngOnInit() {
  }

}
