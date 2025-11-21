import { CommonModule } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CreateProductDto } from '../../interfaces/create-product-dto.interface';
import { InventoryService } from '../../services/inventory.service';


@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css'],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatInputModule,
    MatFormFieldModule,
    MatIconModule,
    MatListModule,
    MatSelectModule,
    MatOptionModule,
    MatButtonModule,
    MatInputModule,
    MatSlideToggleModule,
    MatSnackBarModule,
  ]
})


export default class AddProductComponent {

  // Inyección de dependencias
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private inventory = inject(InventoryService);
  private snackBar = inject(MatSnackBar);

  // Estado
  isSubmitting = false;
  categories: string[] = ['Papelería', 'Informática', 'Bocinas', 'Accesorios'];
  images: File[] = [];

  // Formulario reactivo
  productForm: FormGroup = this.fb.group({
    code: [null],
    name: ['', [Validators.required, Validators.minLength(2)]],
    stock: [0, [Validators.required, Validators.min(0)]],
    salePrice: [0, [Validators.required, Validators.min(0)]],
    costPrice: [0, [Validators.required, Validators.min(0)]],
    category: [null, Validators.required],
    description: [null],
    showOnline: [true],
  });

  get isInvalid() {
    return this.productForm.invalid;
  }

  onBack() {
    this.router.navigate(['/home/inventory']);
  }

  onSubmit() {
    if (this.productForm.invalid || this.isSubmitting) {
      this.productForm.markAllAsTouched();
      return;
    }

    const formValue = this.productForm.value;

    const dto: CreateProductDto = {
      code: formValue.code ?? null,
      name: formValue.name!,
      stock: Number(formValue.stock ?? 0),
      salePrice: Number(formValue.salePrice ?? 0),
      costPrice: Number(formValue.costPrice ?? 0),
      category: formValue.category ?? null,
      description: formValue.description ?? null,
      showOnline: !!formValue.showOnline,
      images: this.images,
    };

    this.isSubmitting = true;

    this.inventory.createProduct(dto).subscribe({
      next: (product) => {
        this.isSubmitting = false;

        this.snackBar.open('Producto creado correctamente', 'Cerrar', {
          duration: 2500,
        });

        // Redirigimos al inventario
        this.router.navigate(['/home/inventory']);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error al crear producto', error);

        this.snackBar.open('Ocurrió un error al crear el producto', 'Cerrar', {
          duration: 3500,
        });
      },
    });
  }

  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const filesArr = Array.from(input.files);
    const remainingSlots = 3 - this.images.length;
    if (remainingSlots <= 0) return;

    this.images = [...this.images, ...filesArr.slice(0, remainingSlots)];
    input.value = '';
  }

  removeImage(index: number) {
    this.images = this.images.filter((_, i) => i !== index);
  }
}
