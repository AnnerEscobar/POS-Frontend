import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

interface SaleCompleteData {
  total: number;
  itemsCount: number;
  saleId?: string;
  change: number;
}

@Component({
  selector: 'app-sale-complete-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule],
  template: `
    <div class="p-4 pt-5 pb-4 max-w-sm mx-auto">
      <div class="flex flex-col items-center text-center space-y-3">
        <div
          class="w-14 h-14 rounded-full bg-emerald-100 flex items-center justify-center mb-1"
        >
          <mat-icon class="text-emerald-600 text-3xl">check_circle</mat-icon>
        </div>

        <h2 class="text-lg font-semibold text-slate-900">
          Venta completada
        </h2>

        <p class="text-sm text-slate-600">
          Se ha registrado la venta con
          <span class="font-semibold">{{ data.itemsCount }}</span>
          producto(s).
        </p>

        <div class="mt-2 w-full rounded-2xl bg-slate-50 border border-slate-200 px-4 py-3 text-sm flex items-center justify-between">
          <span class="text-slate-600">Total cobrado</span>
          <span class="text-base font-semibold text-slate-900">
            Q {{ data.total | number:'1.2-2' }}
          </span>
        </div>

        <!-- CAMBIO / VUELTO -->
<div
  class="mt-2 w-full rounded-2xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm flex items-center justify-between"
>
<span class="text-emerald-700 font-medium">Vuelto</span>
  <span class="text-base font-semibold text-emerald-800">
    Q {{ data.change | number:'1.2-2' }}
  </span>
</div>


        <!-- En el futuro: mostrar número de ticket / FEL aquí -->
        <!-- <p class="text-xs text-slate-500">Núm. de venta: {{ data.saleId }}</p> -->
      </div>

      <div class="mt-5 flex flex-col gap-2">
        <button
          mat-flat-button
          color="primary"
          class="w-full rounded-full"
          (click)="onNewSale()"
        >
          Nueva venta
        </button>

        <button
          mat-stroked-button
          class="w-full rounded-full"
          (click)="onClose()"
        >
          Cerrar
        </button>
      </div>
    </div>
  `,
})
export class SaleCompleteDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<SaleCompleteDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: SaleCompleteData,
  ) { }

  onNewSale() {
    this.dialogRef.close('new-sale');
  }

  onClose() {
    this.dialogRef.close('close');
  }
}
