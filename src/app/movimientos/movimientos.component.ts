import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
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

  form: FormGroup = this.fb.group({
    period: ['day'],
    date: [new Date()],
    search: [''],
  });

  // KPIs que ya usas
  kpis = {
    balance: 0,
    sales: 0,
    expenses: 0,
  };

  // 👇 nuevas propiedades para las ventas
  sales: Sale[] = [];
  loadingSales = false;
  displayedSalesColumns: string[] = ['date', 'concept', 'total', 'method', 'ticket'];

  // si ya tenías incomes/expensesList para otras cosas, los puedes dejar
  incomes: any[] = [];
  expensesList: any[] = [];
  displayedColumns: string[] = ['date', 'concept', 'amount']; // para la tabla de egresos

  ngOnInit(): void {
    // cargar ventas al inicio
    this.loadSalesForFilters();

    // cuando cambien los filtros, recargamos
    this.form.valueChanges.subscribe(() => {
      this.loadSalesForFilters();
    });
  }

  private loadSalesForFilters(): void {
    const date: Date = this.form.get('date')?.value || new Date();
    const search: string = this.form.get('search')?.value || '';

    // rango del día seleccionado
    const from = new Date(date);
    from.setHours(0, 0, 0, 0);

    const to = new Date(date);
    to.setHours(23, 59, 59, 999);

    const fromIso = from.toISOString();
    const toIso = to.toISOString();

    this.loadingSales = true;

    this.salesService.getSales({ from: fromIso, to: toIso, search }).subscribe({
      next: (sales) => {
        this.sales = sales;
        this.loadingSales = false;

        // actualizar KPI de ventas del día
        this.kpis.sales = this.sales.reduce((sum, s) => sum + (s.total || 0), 0);
        this.kpis.balance = this.kpis.sales - this.kpis.expenses;
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

}
