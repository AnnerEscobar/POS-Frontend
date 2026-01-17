import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { SalesService, PaymentMethod, CreateSalePayload } from '../../services/sales.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';

interface ServiceItem {
  type: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

@Component({
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule,
  ],
  selector: 'app-free-sale',
  templateUrl: './free-sale.component.html',
  styleUrls: ['./free-sale.component.css']
})
export default class FreeSaleComponent implements OnInit {

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private salesService = inject(SalesService);
  private snackBar = inject(MatSnackBar);

  // Form principal: datos cliente + pago
  form: FormGroup = this.fb.group({
    description: [''], // ya no requerida, solo por compatibilidad
    amount: [{ value: 0, disabled: true }], // total calculado
    customerName: [''],
    customerNit: ['CF'],
    method: ['efectivo' as PaymentMethod, Validators.required],
    paid: [0, [Validators.required, Validators.min(0)]],
    change: [{ value: 0, disabled: true }],
  });

  // Form para agregar servicios
  serviceForm: FormGroup = this.fb.group({
    type: ['IMPRESIONES', Validators.required],
    quantity: [1, [Validators.required, Validators.min(1)]],
    unitPrice: [0, [Validators.required, Validators.min(0.01)]],
  });

  serviceOptions = [
    { value: 'IMPRESIONES', label: 'Impresiones' },
    { value: 'COPIAS', label: 'Copias' },
    { value: 'SCANNERS', label: 'Scanners' },
    { value: 'TRÁMITES', label: 'Trámites' },
  ];

  serviceItems: ServiceItem[] = [];

  get amount(): number {
    return this.serviceItems.reduce((sum, item) => sum + item.subtotal, 0);
  }

  constructor() { }

  ngOnInit(): void {
    // recalcular cambio cuando cambien pago o método
    this.form.get('paid')?.valueChanges.subscribe(() => this.updateChange());
    this.form.get('method')?.valueChanges.subscribe(() => this.updateChange());

    // cálculo inicial
    this.syncAmountControl();
    this.updateChange();
  }

  // Sincroniza el control amount con los servicios
  private syncAmountControl() {
    this.form.get('amount')?.setValue(this.amount, { emitEvent: false });
  }

  addService() {
    if (this.serviceForm.invalid) {
      this.serviceForm.markAllAsTouched();
      return;
    }

    const type = this.serviceForm.get('type')?.value as string;
    const quantity = Number(this.serviceForm.get('quantity')?.value || 0);
    const unitPrice = Number(this.serviceForm.get('unitPrice')?.value || 0);
    const subtotal = quantity * unitPrice;

    if (subtotal <= 0) {
      this.snackBar.open('El subtotal debe ser mayor a 0', 'Cerrar', {
        duration: 2000,
      });
      return;
    }

    this.serviceItems.push({ type, quantity, unitPrice, subtotal });

    // limpiar un poco para el siguiente
    this.serviceForm.patchValue({
      quantity: 1,
      unitPrice: 0,
    });

    this.syncAmountControl();
    this.updateChange();
  }

  removeService(index: number) {
    this.serviceItems.splice(index, 1);
    this.syncAmountControl();
    this.updateChange();
  }

  updateChange() {
    const method = this.form.get('method')?.value as PaymentMethod;
    const paid = Number(this.form.get('paid')?.value || 0);
    const total = this.amount;

    let change = 0;

    if (method === 'efectivo' || method === 'mixto') {
      change = paid - total;
      if (change < 0) change = 0;
    }

    this.form.get('change')?.setValue(change, { emitEvent: false });
  }

  goBack() {
    this.router.navigate(['/home/sales']);
  }

  submit() {
    if (this.serviceItems.length === 0) {
      this.snackBar.open('Agrega al menos un servicio', 'Cerrar', {
        duration: 2500,
      });
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const total = this.amount;
    const method = this.form.get('method')?.value as PaymentMethod;
    const paid = Number(this.form.get('paid')?.value || 0);

    if ((method === 'efectivo' || method === 'mixto') && paid < total) {
      this.snackBar.open('El monto recibido es menor al total', 'Cerrar', {
        duration: 2500,
      });
      return;
    }

    // Descripción resumen tipo "IMPRESIONES x 10, COPIAS x 5..."
    const descriptionSummary = this.serviceItems
      .map(item => `${item.type} x${item.quantity}`)
      .join(', ');

    const payload: CreateSalePayload = {
      items: this.serviceItems.map(item => ({
        productId: null,
        name: item.type,
        price: item.unitPrice,
        quantity: item.quantity,
        subtotal: item.subtotal,
        code: null,
      })),
      total,
      customer: {
        name: this.form.get('customerName')?.value?.trim() || null,
        nit: this.form.get('customerNit')?.value?.trim() || 'CF',
      },
      payment: {
        method,
        paid,
        change: this.form.get('change')?.value as number,
      },
      // si en tu backend puedes guardar algún comentario extra:
      // description: descriptionSummary,  <-- solo si tu CreateSalePayload lo soporta
    };

    this.salesService.createSale(payload).subscribe({
      next: () => {
        this.snackBar.open('Venta libre registrada', 'Cerrar', {
          duration: 2500,
        });
        this.router.navigate(['/home/sales'], {
          state: { saleComplete: true },
        });
      },
      error: (err) => {
        console.error(err);
        this.snackBar.open('Error al registrar la venta libre', 'Cerrar', {
          duration: 3000,
        });
      },
    });
  }

}
