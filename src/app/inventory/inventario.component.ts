import { MatSnackBar } from '@angular/material/snack-bar';
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
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CategoryService } from './services/category.service';
import { CreateCategoryDialogComponent } from './modals/create-category-dialog.component'; // ajusta ruta
import * as XLSX from 'xlsx';


import {
  InventoryService,
  Product as BackendProduct,
  StockStatus,
} from './services/inventory.service';
import { ConfirmUpdateProductDialogComponent } from './modals/confirm-update-product-dialog.component';

type Product = {
  id: string;
  name: string;
  price: number;
  cost: number;
  stock: number;
  image?: string | null;
  category?: string | null;
};

export interface ProductRow extends Product {
  tempPrice: number;
  tempCost: number;
  tempStock: number;
  hasChanges: boolean;
}

type Category = {
  _id: string;
  name: string;
  isActive?: boolean;
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
    MatDialogModule,
  ],
})
export default class InventarioComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private inventory: InventoryService = inject(InventoryService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private categoryService = inject(CategoryService);

  // Ahora trabajamos directamente con ProductRow
  data = signal<ProductRow[]>([]);

  // filtros / estado UI
  form = this.fb.group({ search: [''] });
  selectedCategory = signal<string | null>(null);
  selectedStockFilter = signal<StockFilter>('all');
  drawerOpened = false;
  categoryList = signal<Category[]>([]);

  // métricas de stock
  lowStockCount = computed(() =>
    this.data().filter((p) => p.stock === 1 || p.stock === 2).length
  );

  outOfStockCount = computed(() =>
    this.data().filter((p) => p.stock === 0).length
  );

  categories = computed(() => this.categoryList());

  filtered = computed(() => this.data());

  // agregamos columna de acciones
  cols = ['product', 'price', 'cost', 'stock', 'profit', 'actions'];

  // Paginación
  pageIndex = signal(0);
  pageSize = signal(5);

  paged = computed(() => {
    const data = this.filtered();
    const start = this.pageIndex() * this.pageSize();
    const end = start + this.pageSize();
    return data.slice(start, end);
  });

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

  totalCost = computed(() =>
    this.data().reduce((a, c) => a + c.cost * c.stock, 0)
  );

  // acciones
  openCategories() {
    this.drawerOpened = true;
  }

  onCategoryClick(cat: Category) {
    this.selectCategory(cat.name);
    this.drawerOpened = false;
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
      this.selectedStockFilter.set('all');
    } else {
      this.selectedStockFilter.set(f);
    }
    this.pageIndex.set(0);
    this.loadProducts();
  }

  clearAllFilters() {
    this.selectedCategory.set(null);
    this.selectedStockFilter.set('all');
    this.form.patchValue({ search: '' });
    this.pageIndex.set(0);
    this.loadProducts();
  }

    downloadExcel() {
    // Usamos los productos filtrados actuales
    const data = this.filtered(); // ProductRow[]

    if (!data.length) {
      this.snackBar.open('No hay productos para exportar', 'Cerrar', {
        duration: 2000,
      });
      return;
    }

    // Armamos las filas que irán al Excel
    const rows = data.map(p => ({
      'Producto': p.name,
      'Categoría': p.category ?? '',
      'Precio': p.price,
      'Costo': p.cost,
      'Stock': p.stock,
      'Ganancia Q': this.profitAmount(p),
      'Ganancia %': this.profitPercent(p),
    }));

    // 1) Convertimos JSON -> hoja de Excel
    const worksheet = XLSX.utils.json_to_sheet(rows);

    // 2) Creamos el libro
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');

    // 3) Descargamos el archivo
    XLSX.writeFile(workbook, 'inventario.xlsx');
  }


  // ediciones inline: actualizamos los campos temporales
  setPrice(row: ProductRow, v: string) {
    row.tempPrice = Number(v) || 0;
    this.onFieldChange(row);
  }

  setCost(row: ProductRow, v: string) {
    row.tempCost = Number(v) || 0;
    this.onFieldChange(row);
  }

  setStock(row: ProductRow, v: string) {
    row.tempStock = Number(v) || 0;
    this.onFieldChange(row);
  }

  // ganancias
  profitAmount = (p: ProductRow) => p.price - p.cost;
  profitPercent = (p: ProductRow) =>
    p.price ? ((p.price - p.cost) / p.price) * 100 : 0;

  constructor() { }

  ngOnInit() {
    this.loadProducts();
    this.loadCategories();
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
        limit: 1000,
      })
      .subscribe({
        next: (res: { items: BackendProduct[]; total: number; page: number; limit: number }) => {
          const products: BackendProduct[] = res.items || [];

          const mapped: ProductRow[] = products.map((p) => ({
            id: p._id,
            name: p.name,
            price: p.price,
            cost: p.cost,
            stock: p.stock,
            image: p.image,
            category: p.category,
            tempPrice: p.price,
            tempCost: p.cost,
            tempStock: p.stock,
            hasChanges: false,
          }));

          this.data.set(mapped);
        },
        error: (err) => {
          console.error('Error cargando productos:', err);
        },
      });
  }

  onFieldChange(row: ProductRow) {
    row.hasChanges =
      row.tempPrice !== row.price ||
      row.tempCost !== row.cost ||
      row.tempStock !== row.stock;
  }

  openConfirmDialog(row: ProductRow) {
    const dialogRef = this.dialog.open(ConfirmUpdateProductDialogComponent, {
      width: '380px',
      data: {
        name: row.name,
        newPrice: row.tempPrice,
        newCost: row.tempCost,
        newStock: row.tempStock,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result === 'confirm') {
        this.saveRowChanges(row);
      }
    });
  }

  saveRowChanges(row: ProductRow) {
    const payload: any = {};

    if (row.tempPrice !== row.price) payload.price = row.tempPrice;
    if (row.tempCost !== row.cost) payload.cost = row.tempCost;
    if (row.tempStock !== row.stock) payload.stock = row.tempStock;

    if (Object.keys(payload).length === 0) return;

    this.inventory.updateProduct(row.id, payload).subscribe({
      next: (updated) => {
        // sincronizar valores reales con los temporales
        row.price = updated.price;
        row.cost = updated.cost;
        row.stock = updated.stock;

        row.tempPrice = updated.price;
        row.tempCost = updated.cost;
        row.tempStock = updated.stock;
        row.hasChanges = false;

        this.snackBar.open('Producto actualizado', 'Cerrar', {
          duration: 2000,
        });
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Error al actualizar el producto', 'Cerrar', {
          duration: 3000,
        });
      },
    });
  }

  private loadCategories() {
    this.categoryService.getCategories().subscribe({
      next: (cats) => {
        // cats ya es un array de { _id, name, ... }
        this.categoryList.set(cats as Category[]);
      },
      error: (err) => {
        console.error('Error cargando categorías', err);
      },
    });
  }

  openCreateCategoryDialog() {
    const dialogRef = this.dialog.open(CreateCategoryDialogComponent, {
      width: '380px',
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (!result?.name) return;

      this.categoryService.createCategory(result.name).subscribe({
        next: (created: any) => {
          // añadirla al listado local
          this.categoryList.update((list) => [...list, created]);
          this.snackBar.open('Categoría creada', 'Cerrar', {
            duration: 2000,
          });
        },
        error: (err) => {
          console.error('Error creando categoría', err);
          this.snackBar.open('No se pudo crear la categoría', 'Cerrar', {
            duration: 3000,
          });
        },
      });
    });
  }


}
