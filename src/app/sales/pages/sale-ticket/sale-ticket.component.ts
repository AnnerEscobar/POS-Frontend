import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Sale, SalesService } from '../../services/sales.service';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-sale-ticket',
  standalone: true,
  imports: [CommonModule, MatButtonModule],
  templateUrl: './sale-ticket.component.html',
  styleUrls: ['./sale-ticket.component.css'],
})
export default class SaleTicketComponent implements OnInit {

  private route = inject(ActivatedRoute);
  private salesService = inject(SalesService);
  private router = inject(Router);

  sale: Sale | null = null;
  loading = true;
  error = '';

  ngOnInit(): void {
  const saleId = this.route.snapshot.paramMap.get('id');
  if (!saleId) {
    this.error = 'Venta no encontrada';
    this.loading = false;
    return;
  }


  this.salesService.getSaleById(saleId).subscribe({
    next: (sale: Sale) => {
      console.log('SALE DATA:', sale);
      this.sale = sale;
      this.loading = false;

      setTimeout(() => {
        window.print();
      }, 400);
    },
    error: (err: any) => {
      console.error(err);
      this.error = 'Error al cargar la venta';
      this.loading = false;
    }
  });
}

  print() {
    window.print();
  }

  close() {
    // Si vino desde una pestaña nueva, esto intenta cerrarla
    window.close();
  }

  backToSales() {
    this.router.navigate(['/home/sales']);
  }
}
