import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { InventoryService } from '../services/inventory.service';

export interface ProductDetailsData {
  id: string;
  name: string;
  image?: string | null;
  code?: string | null;
  category?: string | null;
  description?: string | null;
  price: number;
  cost: number;
  stock: number;
  createdAt?: string;
}

@Component({
  standalone: true,
  selector: 'app-product-details-dialog',
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    ReactiveFormsModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="p-6 max-w-lg">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-2xl font-semibold flex items-center gap-2">
          <mat-icon class="text-slate-600">info</mat-icon>
          Detalles del producto
        </h2>

        <button mat-icon-button (click)="close()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="flex items-start gap-4">
        <img
          [src]="data.image || ''"
          class="w-32 h-32 rounded-lg bg-gray-100 object-cover"
          alt="Imagen del producto"
        />

        <div class="flex-1 space-y-2" *ngIf="!isEditing; else editBasics">
          <div>
            <span class="font-semibold text-slate-700">Nombre:</span>
            <span class="text-slate-800">{{ data.name }}</span>
          </div>

          <div *ngIf="data.code">
            <span class="font-semibold text-slate-700">Código:</span>
            <span>{{ data.code }}</span>
          </div>

          <div>
            <span class="font-semibold text-slate-700">Categoría:</span>
            <span>{{ data.category || 'N/A' }}</span>
          </div>

          <div>
            <span class="font-semibold text-slate-700">Stock:</span>
            <span>{{ data.stock }}</span>
          </div>
        </div>

        <ng-template #editBasics>
          <form [formGroup]="form" class="flex-1 space-y-3">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Nombre</mat-label>
              <input matInput formControlName="name" />
            </mat-form-field>

            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Categoría</mat-label>
              <input matInput formControlName="category" />
            </mat-form-field>
          </form>
        </ng-template>
      </div>

      <div class="mt-5 space-y-2">
        <div *ngIf="!isEditing; else editDescription">
          <span class="font-semibold text-slate-700">Descripción:</span>
          <p class="text-slate-600 whitespace-pre-line">
            {{ data.description || 'Sin descripción' }}
          </p>
        </div>

        <ng-template #editDescription>
          <form [formGroup]="form">
            <mat-form-field appearance="outline" class="w-full">
              <mat-label>Descripción</mat-label>
              <textarea
                matInput
                rows="4"
                formControlName="description">
              </textarea>
            </mat-form-field>
          </form>
        </ng-template>

        <div class="flex gap-6 mt-3">
          <div>
            <span class="font-semibold text-slate-700">Precio:</span>
            <span>Q {{ data.price | number : '1.2-2' }}</span>
          </div>

          <div>
            <span class="font-semibold text-slate-700">Costo:</span>
            <span>Q {{ data.cost | number : '1.2-2' }}</span>
          </div>

          <div>
            <span class="font-semibold text-slate-700">Ganancia:</span>
            <span>Q {{ (data.price - data.cost) | number : '1.2-2' }}</span>
          </div>
        </div>

        <div *ngIf="data.createdAt" class="text-sm text-slate-500 mt-3">
          Creado: {{ data.createdAt | date : 'medium' }}
        </div>
      </div>

      <div class="flex justify-end mt-6 gap-2">
        <button *ngIf="!isEditing" mat-stroked-button (click)="enableEdit()">
          <mat-icon class="mr-1">edit</mat-icon>
          Editar
        </button>

        <ng-container *ngIf="isEditing">
          <button mat-button (click)="cancelEdit()">
            Cancelar
          </button>
          <button mat-raised-button color="primary" (click)="save()" [disabled]="form.invalid || loading">
            <mat-icon class="mr-1" *ngIf="!loading">save</mat-icon>
            {{ loading ? 'Guardando...' : 'Guardar cambios' }}
          </button>
        </ng-container>
      </div>
    </div>
  `,
})
export class ProductDetailsDialogComponent {
  isEditing = false;
  loading = false;

  form: FormGroup; // declare, don't initialize here

  constructor(
    private fb: FormBuilder,
    private inventory: InventoryService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<ProductDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ProductDetailsData
  ) {
    // initialize form after fb is injected
    this.form = this.fb.group({
      name: [this.data.name, [Validators.required, Validators.minLength(2)]],
      category: [this.data.category ?? ''],
      description: [this.data.description ?? ''],
    });
  }


  enableEdit() {
    this.isEditing = true;
  }

  cancelEdit() {
    this.isEditing = false;
    this.form.reset({
      name: this.data.name,
      category: this.data.category ?? '',
      description: this.data.description ?? '',
    });
  }

  save() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, category, description } = this.form.value;

    const payload: any = {};
    if (name !== this.data.name) payload.name = name;
    if ((category ?? '') !== (this.data.category ?? '')) {
      payload.category = category?.trim() || null;
    }
    if ((description ?? '') !== (this.data.description ?? '')) {
      payload.description = description?.trim() || null;
    }

    if (Object.keys(payload).length === 0) {
      this.isEditing = false;
      return;
    }

    this.loading = true;

    this.inventory.updateProduct(this.data.id, payload).subscribe({
      next: (updated) => {
        // sincronizar data local del modal
        this.data.name = updated.name;
        this.data.category = updated.category;
        this.data.description = updated.description;

        this.loading = false;
        this.isEditing = false;

        this.snackBar.open('Producto actualizado', 'Cerrar', {
          duration: 2000,
        });

        // devolvemos el producto actualizado al componente padre
        this.dialogRef.close(updated);
      },
      error: (err) => {
        console.error(err);
        this.loading = false;
        this.snackBar.open('Error al actualizar el producto', 'Cerrar', {
          duration: 3000,
        });
      },
    });
  }

  close() {
    this.dialogRef.close();
  }
}
