import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import {MatTabsModule} from '@angular/material/tabs';
import {MatSelectModule} from '@angular/material/select';
import {MatTableModule} from '@angular/material/table';
import {MatDatepickerModule} from '@angular/material/datepicker';
import {MatMenuModule} from '@angular/material/menu';

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

  form = this.fb.group({
    period: ['day'],
    date: [new Date()],
    search: [''],
  });

  // KPIs mock (reemplaza con datos reales del backend)
  kpis = { balance: 0, sales: 0, expenses: 0 };

  // tablas mock
  displayedColumns = ['date', 'concept', 'amount'];
  incomes: Array<{date: Date; concept: string; amount: number}> = [];
  expensesList: Array<{date: Date; concept: string; amount: number}> = [];
  constructor() { }

  ngOnInit() {
  }

}
