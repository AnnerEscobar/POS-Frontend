import { CommonModule } from '@angular/common';
import {
  Component,
  inject,
  OnInit,
  AfterViewInit,
  ElementRef,
  ViewChild,
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
  FormControl,
} from '@angular/forms';
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
import { BrowserMultiFormatReader, IScannerControls } from '@zxing/browser';
import { CategoryService } from '../../services/category.service';
import { Category } from '../../interfaces/category';

@Component({
  selector: 'app-add-product',
  templateUrl: './add-product.component.html',
  styleUrls: ['./add-product.component.css'],
  standalone: true,
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
    MatSlideToggleModule,
    MatSnackBarModule,
  ],
})
export default class AddProductComponent implements OnInit, AfterViewInit {
  // Inyección de dependencias
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private inventory = inject(InventoryService);
  private snackBar = inject(MatSnackBar);
  private categoryService = inject(CategoryService);
  private controls?: IScannerControls;

  // Estado
  isSubmitting = false;
  categories: Category[] = [];
  images: File[] = [];
  newCategoryControl = new FormControl<string>('');
  private codeReader = new BrowserMultiFormatReader();
  scanning = false;

  private codeInputElement?: HTMLInputElement;
  @ViewChild('video') videoRef?: ElementRef<HTMLVideoElement>;

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

  // GETTERS
  get isInvalid() {
    return this.productForm.invalid;
  }

  // CICLO DE VIDA
  ngOnInit(): void {
    this.categoryService.getCategories().subscribe({
      next: (cats) => (this.categories = cats),
      error: (err) => console.error('Error cargando categorías', err),
    });
  }

  ngAfterViewInit(): void {
    // no hace falta iniciar nada aquí por ahora
  }

  // UTILIDAD: detectar móvil
  private isMobile(): boolean {
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  }

  // ESCÁNER CÁMARA
  private async startCameraScan() {
    const hasMediaDevices =
      typeof navigator !== 'undefined' &&
      'mediaDevices' in navigator &&
      !!navigator.mediaDevices?.getUserMedia;

    if (!hasMediaDevices) {
      this.snackBar.open(
        'El navegador no permite acceder a la cámara en este contexto. Prueba en HTTPS o con otro navegador.',
        'Cerrar',
        { duration: 4000 }
      );
      return;
    }

    this.scanning = true;

    setTimeout(() => {
      // pequeño delay para asegurarnos que el <video> ya existe en el DOM
      this.initZxing();
    });
  }

  private async initZxing() {
    if (!this.videoRef) return;

    try {
      this.controls = await this.codeReader.decodeFromVideoDevice(
        undefined, // en vez de null
        this.videoRef.nativeElement,
        (result, err) => {
          if (result) {
            const text = result.getText();
            this.productForm.patchValue({ code: text });

            this.snackBar.open('Código detectado', 'Cerrar', {
              duration: 2000,
            });

            this.stopCameraScan();
          }
        }
      );
    } catch (e: any) {
      console.error('Error iniciando cámara', e);
      const msg = e?.message || '';
      this.snackBar.open(
        `No se pudo acceder a la cámara (${msg})`,
        'Cerrar',
        {
          duration: 4000,
        }
      );
      this.stopCameraScan();
    }
  }

  stopCameraScan() {
    this.scanning = false;
    try {
      if (this.controls) {
        this.controls.stop();
        this.controls = undefined;
      }
    } catch (e) {
      console.warn('Error al detener lector', e);
    }
  }

  onScanCodeClick(input: HTMLInputElement) {
    this.codeInputElement = input;

    if (!this.isMobile()) {
      // PC: solo enfocamos el input
      input.focus();
      this.snackBar.open(
        'Ahora escanea el código con tu lector.',
        'Cerrar',
        {
          duration: 2500,
        }
      );
      return;
    }

    // Móvil: abrir cámara
    this.startCameraScan();
  }

  // MÉTODOS PARA AGREGAR NUEVA CATEGORÍA
 addNewCategory() {
  const name = this.newCategoryControl.value?.trim();
  if (!name) return;

  this.categoryService.createCategory(name).subscribe({
    next: (created) => {
      // Agregamos la nueva categoría al arreglo local para que aparezca sin recargar
      this.categories = [...this.categories, created];

      // La seleccionamos en el formulario
      const categoryControl = this.productForm.get('category');
      if (categoryControl) {
        categoryControl.setValue(created.name);
      }

      this.newCategoryControl.reset();

      this.snackBar.open('Categoría agregada', 'Cerrar', {
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
}


  // NAVEGACIÓN
  onBack() {
    this.router.navigate(['/home/inventory']);
  }

  // SUBMIT
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
      next: () => {
        this.isSubmitting = false;
        this.snackBar.open('Producto creado correctamente', 'Cerrar', {
          duration: 2500,
        });
        this.router.navigate(['/home/inventory']);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Error al crear producto', error);
        this.snackBar.open(
          'Ocurrió un error al crear el producto',
          'Cerrar',
          { duration: 3500 }
        );
      },
    });
  }

  // MANEJO DE IMÁGENES
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
