import { Component, OnInit, inject } from '@angular/core';
import { CommonModule, NgFor, NgIf } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import {
  InventoryService,
  Product as BackendProduct,
} from '../inventory/services/inventory.service';
import { CreateSalePayload, PaymentMethod, SalesService } from './services/sales.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { MatOption } from "@angular/material/core";
import { MatSelectModule } from '@angular/material/select';
import { ViewChild, ElementRef } from '@angular/core';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { SaleCompleteDialogComponent } from './modals/sale-complete-dialog.component';


// Productos que se muestran en las tarjetas
type SaleProduct = {
  id: string;
  name: string;
  price: number;
  stock: number;
  code?: string | null;
  image?: string | null;
  category?: string | null;
};

// Elementos dentro de la canasta
type CartItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
  code?: string | null;
  image?: string | null;
  stock?: number;
};

@Component({
  standalone: true,
  selector: 'app-sales',
  templateUrl: './sales.component.html',
  styleUrls: ['./sales.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatCardModule,
    MatDividerModule,
    MatBadgeModule,
    MatTooltipModule,
    MatMenuModule,
    MatChipsModule,
    NgIf,
    NgFor,
    MatOption,
    MatSelectModule,
    MatDialogModule,

  ],
})
export default class SalesComponent implements OnInit {
  private inventory = inject(InventoryService);
  private salesService = inject(SalesService); // lo seguirás usando quizá más adelante
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private dialog = inject(MatDialog);


  form = this.fb.group({
    search: [''],
  });

  products: SaleProduct[] = [];
  filteredProducts: SaleProduct[] = [];
  @ViewChild('paidInput') paidInput?: ElementRef<HTMLInputElement>;
  @ViewChild('scannerInput') scannerInput?: ElementRef<HTMLInputElement>;



  cart: CartItem[] = [];
  paymentMode = false;

  paymentForm: FormGroup = this.fb.group({
    customerName: [''],
    customerNit: ['CF'],
    method: ['efectivo' as PaymentMethod, Validators.required],
    paid: [0, [Validators.required, Validators.min(0)]],
    change: [{ value: 0, disabled: true }],
  });



  searchTerm = '';
  selectedCategory: string | null = null;

  ngOnInit(): void {
    this.loadProducts();

    this.form.controls.search.valueChanges.subscribe((value) => {
      this.onSearchChange((value ?? '').toString());
    });
    setTimeout(() => this.focusScanner(), 0);

  }

  private focusScanner() {
    setTimeout(() => {
      const el = this.scannerInput?.nativeElement;
      if (!el) return;
      el.focus();
      el.select();
    }, 0);
  }



  // ------------ Productos / filtros ------------
  loadProducts(search?: string) {
    this.inventory
      .getProducts({
        search,
        stockStatus: 'all',
        page: 1,
        limit: 200,
      })
      .subscribe({
        next: (res) => {
          this.products =
            res.items?.map((p: BackendProduct) => ({
              id: p._id,
              name: p.name,
              price: p.price,
              stock: p.stock,
              code: p.code,
              image: p.image,
              category: p.category,
            })) ?? [];

          this.applyFilters();
        },
        error: (err) => {
          console.error('Error cargando productos', err);
        },
      });
  }

  onSearchChange(value: string) {
    this.searchTerm = value ?? '';
    this.applyFilters();
  }

  onScanEnter() {
    const term = (this.form.controls.search.value ?? '').toString().trim();
    if (!term) return;

    // 1) Match exacto por código (scanner)
    let found = this.products.find(p => (p.code ?? '').trim() === term);

    // 2) Fallback: buscar por nombre
    if (!found) {
      const lower = term.toLowerCase();
      found = this.products.find(p => p.name.toLowerCase().includes(lower));
    }

    if (!found) {
      this.snackBar.open('Producto no encontrado', 'Cerrar', { duration: 1500 });
      this.focusScanner();
      return;
    }

    // Agrega o incrementa
    this.addToCart(found, { ignorePaymentMode: true });

    // Limpiar input
    this.form.controls.search.setValue('', { emitEvent: true });

    // Volver a enfocar para seguir escaneando
    this.focusScanner();
  }


  selectCategory(category: string | null) {
    this.selectedCategory = category;
    this.applyFilters();
  }

  categories() {
    const set = new Set(
      this.products
        .map((p) => p.category)
        .filter(Boolean) as string[],
    );
    return Array.from(set);
  }

  private applyFilters() {
    const term = this.searchTerm.trim().toLowerCase();

    this.filteredProducts = this.products.filter((p) => {
      const byCategory =
        !this.selectedCategory || p.category === this.selectedCategory;

      const bySearch =
        term === '' ||
        p.name.toLowerCase().includes(term) ||
        (p.code ?? '').toLowerCase().includes(term);

      return byCategory && bySearch;
    });
  }

  filteredProductsFn() {
    return this.filteredProducts;
  }

  // ------------ Carrito ------------
  addToCart(product: SaleProduct, opts?: { ignorePaymentMode?: boolean }) {
    // Si estás en pago, normalmente bloqueas clicks.
    // Para scanner, permitimos sumar items.
    if (this.paymentMode && !opts?.ignorePaymentMode) return;

    const existing = this.cart.find((c) => c.productId === product.id);

    if (existing) {
      if (existing.quantity < product.stock) {
        existing.quantity++;
        existing.subtotal = existing.quantity * existing.price;
        this.updateChange(); // ✅ si estás en pago, recalcula el vuelto
      } else {
        this.snackBar.open('No hay más existencias de este producto', 'Cerrar', {
          duration: 2000,
        });
      }
      return;
    }

    if (product.stock <= 0) {
      this.snackBar.open('Producto sin existencias', 'Cerrar', {
        duration: 2000,
      });
      return;
    }

    this.cart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      subtotal: product.price,
      code: product.code,
    });

    this.updateChange(); // ✅ si estás en pago
  }



  countInCart(productId: string): number {
    const item = this.cart.find((c) => c.productId === productId);
    return item ? item.quantity : 0;
  }

  increaseQuantity(item: CartItem) {
    const product = this.products.find((p) => p.id === item.productId);
    if (!product) return;

    if (item.quantity < product.stock) {
      item.quantity++;
      item.subtotal = item.quantity * item.price;
    }
  }

  decreaseQuantity(item: CartItem) {
    if (item.quantity <= 1) {
      this.removeFromCart(item);
      return;
    }
    item.quantity--;
    item.subtotal = item.quantity * item.price;
  }

  removeFromCart(item: CartItem) {
    this.cart = this.cart.filter((c) => c.productId !== item.productId);
  }

  clearCart() {
    this.cart = [];
  }

  totalItems(): number {
    return this.cart.reduce((sum, item) => sum + item.quantity, 0);
  }

  get cartTotal(): number {
    return this.cart.reduce((sum, item) => sum + item.subtotal, 0);
  }


  trackById(index: number, item: CartItem) {
    return item.productId;
  }
  // ------------ Flujo de cobro dentro del panel ------------
  onContinue() {
    if (this.cart.length === 0) return;
    this.paymentMode = true;

    // 👇 Dar tiempo a que Angular pinte el panel y luego enfocar
    setTimeout(() => {
      this.paidInput?.nativeElement.focus();
      this.paidInput?.nativeElement.select(); // opcional: selecciona el 0
    }, 0);
  }


  // ------------ Navegación extra ------------
  startFreeSale() {
    this.router.navigate(['/home/sales/free']);
  }

  newExpense() {
    this.router.navigate(['/home/expenses']);
  }

  createProduct() {
    this.router.navigate(['/home/inventory/add-product']);
  }

  public updateChange() {
    const method = this.paymentForm.value.method as PaymentMethod;
    const paid = Number(this.paymentForm.value.paid || 0);

    let change = 0;

    if (method === 'efectivo' || method === 'mixto') {
      change = paid - this.cartTotal;
      if (change < 0) change = 0;
    }

    this.paymentForm.get('change')!.setValue(change);
  }

  cancelPayment() {
    this.paymentMode = false;
    this.focusScanner();
  }


  confirmPayment() {
    if (this.cart.length === 0) return;
    if (this.paymentForm.invalid) return;

    const method = this.paymentForm.value.method as PaymentMethod;
    const paid = Number(this.paymentForm.value.paid || 0);

    if ((method === 'efectivo' || method === 'mixto') && paid < this.cartTotal) {
      this.snackBar.open('El monto recibido es menor al total', 'Cerrar', {
        duration: 2500,
      });
      return;
    }

    const payload: CreateSalePayload = {
      items: this.cart.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        subtotal: item.subtotal,
        code: item.code,
      })),
      total: this.cartTotal,
      customer: {
        name: this.paymentForm.value.customerName?.trim() || null,
        nit: this.paymentForm.value.customerNit?.trim() || 'CF',
      },
      payment: {
        method,
        paid,
        change: this.paymentForm.get('change')!.value,
      },
    };

    console.log('Enviando venta al backend:', payload);

    this.salesService.createSale(payload).subscribe({
      next: (sale) => {
        // Guardamos estos valores ANTES de limpiar el carrito
        const saleTotal = this.cartTotal;
        const itemsCount = this.cart.length;

        console.log('Respuesta de createSale:', sale);
        const saleId = sale?._id;

        if (!saleId) {
          this.snackBar.open(
            'Venta registrada, pero no se recibió el ID para imprimir ticket.',
            'Cerrar',
            { duration: 3000 }
          );
          return;
        }

        // 1) Creamos la URL con el router
        const url = this.router.serializeUrl(
          this.router.createUrlTree(['/ticket', saleId])
        );

        // 2) Abrimos el ticket en una pestaña nueva SÓLO con el recibo
        window.open(url, 'ticket', 'width=420,height=700');

        // Refrescamos productos desde backend (como ya lo hacías)
        this.loadProducts(this.searchTerm || '');

        // Limpiar UI de la venta actual
        this.cart = [];
        this.paymentForm.reset({
          customerName: '',
          customerNit: 'CF',
          method: 'efectivo',
          paid: 0,
          change: 0,
        });
        this.paymentMode = false;

        // 👉 Abrir modal de confirmación
        const dialogRef = this.dialog.open(SaleCompleteDialogComponent, {
          width: '360px',
          data: {
            total: saleTotal,
            itemsCount,
            saleId: (sale as any)._id, // opcional, por si lo quieres luego
            change: payload.payment.change,  //vuelto
          },
        });

        dialogRef.afterClosed().subscribe((result) => {
          // Por ahora no hace falta hacer nada extra
          // pero podrías reaccionar a 'new-sale' o 'close' si quisieras
          // console.log('Modal cerrado con:', result);
        });
      },
      error: (err) => {
        console.error('Error al registrar la venta', err);

        const msg = err?.error?.message ?? '';

        if (typeof msg === 'string' && msg.toLowerCase().includes('caja abierta')) {
          this.snackBar
            .open('Debes abrir caja antes de vender.', 'Abrir caja', { duration: 5000 })
            .onAction()
            .subscribe(() => this.router.navigate(['/home/cash'])); // ajusta tu ruta real

          return;
        }

        this.snackBar.open('Error al registrar la venta', 'Cerrar', { duration: 3000 });
      },

    });

  }


}

