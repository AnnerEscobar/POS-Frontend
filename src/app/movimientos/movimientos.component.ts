import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatMenuModule } from '@angular/material/menu';
import { Sale, SalesService } from '../sales/services/sales.service';
import { Router } from '@angular/router';
import { CashRegister, CashService } from './services/cash.service';

@Component({
  selector: 'app-movimientos',
  templateUrl: './movimientos.component.html',
  styleUrls: ['./movimientos.component.css'],
  imports: [
    CommonModule, ReactiveFormsModule,
    MatButtonModule, MatTabsModule, MatCardModule,
    MatFormFieldModule, MatInputModule, MatSelectModule,
    MatMenuModule, MatIconModule, MatDatepickerModule,
    MatTableModule
  ]
})
export default class MovimientosComponent implements OnInit {


  private fb = inject(FormBuilder);
  private router = inject(Router);
  private salesService = inject(SalesService);
  private cashService = inject(CashService);

  // Rango de fechas actualmente aplicado
  rangeFrom?: Date;
  rangeTo?: Date;


  form: FormGroup = this.fb.group({
    period: ['day'],
    date: [new Date()],
    search: [''],
  });

  // 👇 Formularios para caja
  openCashForm: FormGroup = this.fb.group({
    initialAmount: [null, [Validators.required, Validators.min(0)]],
    notes: [''],
  });

  closeCashForm: FormGroup = this.fb.group({
    closingAmount: [null, [Validators.required, Validators.min(0)]],
  });

  showOpenCashForm = false;     // 👈 mostrar/ocultar panel de apertura
  cash: CashRegister | null = null; // 👈 info de la caja actual
  loadingCash = false;

  // KPIs que ya usas
  kpis = {
    balance: 0,
    sales: 0,
    expenses: 0,
  };

  // 👇 nuevas propiedades para las ventas
  sales: Sale[] = [];
  filteredSales: Sale[] = [];
  loadingSales = false;
  displayedSalesColumns: string[] = ['date', 'concept', 'total', 'method', 'ticket'];

  // si ya tenías incomes/expensesList para otras cosas, los puedes dejar
  incomes: any[] = [];
  expensesList: any[] = [];
  displayedColumns: string[] = ['date', 'concept', 'amount']; // para la tabla de egresos

  ngOnInit(): void {
    // cargar ventas al inicio
    this.loadSalesForFilters();

    // cuando cambie el periodo o la fecha -> recargamos desde backend
    this.form.get('period')?.valueChanges.subscribe(() => {
      this.loadSalesForFilters();
    });

    this.form.get('date')?.valueChanges.subscribe(() => {
      this.loadSalesForFilters();
    });

    // cuando cambie la búsqueda -> solo filtramos en memoria
    this.form.get('search')?.valueChanges.subscribe(() => {
      this.applySearchFilter();
    });

    this.loadCashStatus();
  }


  private loadSalesForFilters(): void {
    const period: 'day' | 'week' | 'month' = this.form.get('period')?.value || 'day';
    const date: Date = this.form.get('date')?.value || new Date();
    const search: string = this.form.get('search')?.value || '';

    const baseDate = new Date(date);

    let from = new Date(baseDate);
    let to = new Date(baseDate);

    switch (period) {
      case 'week': {
        const day = baseDate.getDay();
        const diffToMonday = (day === 0 ? -6 : 1) - day;
        from = new Date(baseDate);
        from.setDate(baseDate.getDate() + diffToMonday);
        from.setHours(0, 0, 0, 0);

        to = new Date(from);
        to.setDate(from.getDate() + 6);
        to.setHours(23, 59, 59, 999);
        break;
      }

      case 'month': {
        from = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
        from.setHours(0, 0, 0, 0);

        to = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
        to.setHours(23, 59, 59, 999);
        break;
      }

      case 'day':
      default: {
        from = new Date(baseDate);
        from.setHours(0, 0, 0, 0);

        to = new Date(baseDate);
        to.setHours(23, 59, 59, 999);
        break;
      }
    }

    this.rangeFrom = from;
    this.rangeTo = to;

    const fromIso = from.toISOString();
    const toIso = to.toISOString();

    this.loadingSales = true;

    this.salesService.getSales({ from: fromIso, to: toIso }).subscribe({
      next: (sales) => {
        this.sales = sales;
        this.loadingSales = false;

        // KPIs
        this.kpis.sales = this.sales.reduce((sum, s) => sum + (s.total || 0), 0);
        this.kpis.balance = this.kpis.sales - this.kpis.expenses;

        // 👇 importante: aplicar filtro de búsqueda al cargar
        this.applySearchFilter();
      },
      error: (err) => {
        console.error(err);
        this.loadingSales = false;
      }
    });
  }

  openTicket(id: string) {
    const url = this.router.serializeUrl(
      this.router.createUrlTree(['/ticket', id])
    );
    window.open(url, '_blank');
  }

  private applySearchFilter(): void {
    const searchRaw = this.form.get('search')?.value || '';
    const search = searchRaw.toLowerCase().trim();

    // si no hay texto, mostrar todas las ventas del rango
    if (!search) {
      this.filteredSales = [...this.sales];
      return;
    }

    this.filteredSales = this.sales.filter((s) => {
      const concept = (s.customer?.name || 'Venta mostrador').toLowerCase();
      const paymentMethod = (s.payment?.method || '').toLowerCase();

      // aquí decides qué entra en la búsqueda
      return (
        concept.includes(search) ||
        paymentMethod.includes(search)
        // puedes agregar más campos si quieres:
        // || (s.ticketNumber || '').toLowerCase().includes(search)
      );
    });
  }

  // ---------- CAJA ----------

  private loadCashStatus(): void {
    this.loadingCash = true;
    this.cashService.getStatus().subscribe({
      next: (cash) => {
        this.cash = cash;
        this.loadingCash = false;
      },
      error: (err) => {
        console.error('Error al cargar estado de caja', err);
        this.loadingCash = false;
      }
    });
  }

  toggleOpenCashForm(): void {
    // si ya hay caja abierta, no mostramos el formulario
    if (this.cash && this.cash.status === 'open') {
      this.showOpenCashForm = false;
      return;
    }
    this.showOpenCashForm = !this.showOpenCashForm;
  }

  onOpenCash(): void {
    if (this.openCashForm.invalid || this.loadingCash) return;

    const { initialAmount, notes } = this.openCashForm.value;
    this.loadingCash = true;

    this.cashService.openCash({ initialAmount, notes }).subscribe({
      next: (cash) => {
        this.cash = cash;
        this.loadingCash = false;
        this.showOpenCashForm = false;
        this.openCashForm.reset({ initialAmount: null, notes: '' });
      },
      error: (err) => {
        console.error('Error al abrir caja', err);
        this.loadingCash = false;
      }
    });
  }

  onCloseCash(): void {
    if (!this.cash || this.cash.status !== 'open') return;
    if (this.closeCashForm.invalid || this.loadingCash) return;

    const { closingAmount } = this.closeCashForm.value;
    this.loadingCash = true;

    this.cashService.closeCash({ closingAmount }).subscribe({
      next: (cash) => {
        this.cash = cash; // ahora viene cerrada con expectedAmount y difference
        this.loadingCash = false;
        this.closeCashForm.reset({ closingAmount: null });
      },
      error: (err) => {
        console.error('Error al cerrar caja', err);
        this.loadingCash = false;
      }
    });
  }



}
