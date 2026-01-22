import { CommonModule } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatRadioChange, MatRadioModule } from '@angular/material/radio';
import { MaterialThemeService, MaterialTheme } from '../../theme/theme.service';
import { AuthStateService } from '../../../auth/services/auth-state.service';

@Component({
  standalone: true,
  selector: 'app-settings-dialog',
  imports: [CommonModule, MatDialogModule, MatButtonModule, MatIconModule, MatRadioModule],
  template: `
    <div class="p-4 sm:p-5 w-[340px]">
      <div class="flex items-start justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900">Ajustes</h2>
          <p class="text-sm text-gray-500">Personaliza tu punto de venta</p>
        </div>
        <button mat-icon-button (click)="close()" aria-label="Cerrar">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <div class="mt-5">
        <p class="text-xs font-semibold tracking-wide text-gray-500 uppercase mb-2">Tema</p>

        <div class="rounded-xl border border-gray-200 p-3 bg-white">
          <mat-radio-group
            [value]="theme.theme()"
            (change)="onThemeChange($event)"
          >
            <div class="grid grid-cols-1 gap-2">
              <label
                *ngFor="let t of themes"
                class="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
              >
                <mat-radio-button
                  [value]="t.id"
                  [disabled]="!canChangeTheme()"
                ></mat-radio-button>
                <span class="text-sm">{{ t.label }}</span>
              </label>
            </div>
          </mat-radio-group>

          <div
            *ngIf="!canChangeTheme()"
            class="mt-3 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-2"
          >
            Solo administradores/owner podrán cambiar el tema (lo activaremos más adelante).
          </div>
        </div>
      </div>

      <div class="mt-5 flex justify-end gap-2">
        <button mat-stroked-button (click)="close()">Cerrar</button>
        <button mat-flat-button color="primary" (click)="close()">Listo</button>
      </div>
    </div>
  `,
})
export class SettingsDialogComponent {
  theme = inject(MaterialThemeService);
  auth = inject(AuthStateService);
  ref = inject(MatDialogRef<SettingsDialogComponent>);

  // ✅ Los 8 prebuilt themes reales
  themes: { id: MaterialTheme; label: string }[] = [
    { id: 'azure-blue', label: 'Azure Blue' },
    { id: 'cyan-orange', label: 'Cyan Orange' },
    { id: 'deeppurple-amber', label: 'Deep Purple / Amber' },
    { id: 'indigo-pink', label: 'Indigo / Pink' },
    { id: 'magenta-violet', label: 'Magenta / Violet' },
    { id: 'pink-bluegrey', label: 'Pink / Bluegrey' },
    { id: 'purple-green', label: 'Purple / Green' },
    { id: 'rose-red', label: 'Rose / Red' },
  ];

  // Hoy: todos pueden. Luego: ADMIN/OWNER
  canChangeTheme = computed(() => {
    const u = this.auth.user();
    if (!u) return false;

    return true; // ✅ por ahora

    // Más adelante:
    // return u.role === 'ADMIN' || u.role === 'OWNER';
  });

  onThemeChange(ev: MatRadioChange) {
    if (!this.canChangeTheme()) return;
    this.theme.setTheme(ev.value as MaterialTheme);
  }

  close() {
    this.ref.close();
  }
}
