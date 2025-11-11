import { Component, ViewChild } from '@angular/core';
import { MatDrawerMode, MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { SidenavComponent, SidenavItem } from '../../shared/sidenav/sidenav.component';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-home-layout',
  templateUrl: './home-layout.component.html',
  styleUrls: ['./home-layout.component.css'],
  imports: [
    CommonModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    RouterOutlet,
    SidenavComponent
  ]
})
export default class HomeLayoutComponent {

  @ViewChild('sidenav') sidenav!: MatSidenav;

  mode: MatDrawerMode = 'side';
  opened = true;

  /** Items del menú (puedes moverlos a un servicio si quieres) */
  navItems: SidenavItem[] = [
    { label: 'Movimientos', icon: 'insert_chart', link: 'movimientos' },
    { label: 'Ventas', icon: 'point_of_sale', link: 'sales' },
    { label: 'Inventario', icon: 'inventory_2', link: 'inventory' },
  ];

  constructor(private bp: BreakpointObserver) {
    this.bp.observe('(max-width: 1024px)')
      .pipe(takeUntilDestroyed())
      .subscribe(state => {
        if (state.matches) { this.mode = 'over'; this.opened = false; }
        else { this.mode = 'side'; this.opened = true; }
      });
  }

  toggleSidenav() {
    if (this.mode === 'over') this.sidenav.toggle();
  }


}
