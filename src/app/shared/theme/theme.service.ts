import { effect, inject } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

import { Injectable, signal } from '@angular/core';

export type MaterialTheme =
  | 'azure-blue'
  | 'cyan-orange'
  | 'deeppurple-amber'
  | 'indigo-pink'
  | 'magenta-violet'
  | 'pink-bluegrey'
  | 'purple-green'
  | 'rose-red';

const LS_KEY = 'mat_theme';

@Injectable({ providedIn: 'root' })
export class MaterialThemeService {
  theme = signal<MaterialTheme>(this.loadInitial());

 constructor() {
    // ✅ Esto se ejecuta al iniciar la app y cada vez que cambie el signal
    effect(() => {
      const t = this.theme();
      localStorage.setItem(LS_KEY, t);

      const linkEl = document.getElementById('mat-theme') as HTMLLinkElement | null;
      if (!linkEl) return;

      linkEl.href = `assets/material-themes/${t}.css?v=${Date.now()}`;
    });
  }


  setTheme(t: MaterialTheme) {
    this.theme.set(t);
  }

    private loadInitial(): MaterialTheme {
    return (localStorage.getItem(LS_KEY) as MaterialTheme) ?? 'rose-red';
  }
}
