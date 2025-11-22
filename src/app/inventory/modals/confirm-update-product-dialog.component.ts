import { Component, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-update-product-dialog',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>Confirmar cambios</h2>
    <mat-dialog-content>
      <p>¿Deseas guardar los cambios para <strong>{{ data.name }}</strong>?</p>
      <ul class="text-sm mt-2">
        <li>Precio: Q {{ data.newPrice | number:'1.2-2' }}</li>
        <li>Costo: Q {{ data.newCost | number:'1.2-2' }}</li>
        <li>Stock: {{ data.newStock }}</li>
      </ul>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button color="primary" (click)="onConfirm()">Guardar</button>
    </mat-dialog-actions>
  `,
})
export class ConfirmUpdateProductDialogComponent {
  constructor(
    private dialogRef: MatDialogRef<ConfirmUpdateProductDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
  ) {}

  onCancel() {
    this.dialogRef.close('cancel');
  }

  onConfirm() {
    this.dialogRef.close('confirm');
  }
}
