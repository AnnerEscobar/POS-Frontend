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
import { CreateProductDto } from '../../interfaces/add-product.interface';

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
  ]
})


export default class AddProductComponent  {

   private fb = inject(FormBuilder);
  private router = inject(Router);

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

  categories: string[] = ['Papelería', 'Informática', 'Bocinas', 'Accesorios'];

  images: File[] = [];

  get isInvalid() {
    return this.productForm.invalid;
  }

  onBack() {
    this.router.navigate(['/home/inventory']);
  }

  onSubmit() {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    const dto: CreateProductDto = {
      ...this.productForm.value,
      images: this.images,
    };

    console.log('Crear producto DTO:', dto);

    // luego aquí llamamos al backend
    this.router.navigate(['/home/inventory']);
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
