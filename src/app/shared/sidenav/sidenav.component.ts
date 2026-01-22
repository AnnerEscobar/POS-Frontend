import { CommonModule } from '@angular/common';
import { Component, computed, inject, Input, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStateService } from '../../auth/services/auth-state.service';
import { MatDialog } from '@angular/material/dialog';
import { SettingsDialogComponent } from './modals/settings-dialog.component';

export type SidenavItem = { label: string; icon: string; link: string };

@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrls: ['./sidenav.component.css'],
  imports: [
    CommonModule,
    MatSidenavModule,
    MatListModule,
    MatToolbarModule,
    MatIconModule,
    MatButtonModule,
    MatSidenavModule,
    RouterLink,
    RouterLinkActive,
  ]
})
export class SidenavComponent {

  @Input() items: SidenavItem[] = [];


  auth = inject(AuthStateService);
  router = inject(Router);
  dialog = inject(MatDialog);


  displayName = computed(() => {
    const u = this.auth.user();
    if (!u) return 'Invitado';
    return u.name?.trim() || u.email;
  });

  displayRole = computed(() => {
    const u = this.auth.user();
    if (!u) return 'Sin sesión';
    // Mapeo bonito (ajusta a tus roles reales)
    const map: Record<string, string> = {
      ADMIN: 'Administrador',
      owner: 'Propietario',
      CASHIER: 'Cajero',
      CAJERO: 'Cajero',
      MANAGER: 'Supervisor',
      SUPERVISOR: 'Supervisor',
    };
    return map[u.role] ?? u.role;
  });

  logoutUiOnly() {
    this.auth.clear();
    this.router.navigate(['/login']);
  }

  openSettings() {
    this.dialog.open(SettingsDialogComponent, {
      panelClass: ['pos-dialog'],
      autoFocus: false,
    });

  }

}
