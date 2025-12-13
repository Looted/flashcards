import { Injectable, signal, effect, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DOCUMENT } from '@angular/common';
import { StorageService } from './storage.service';

export type ThemeMode = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private platformId = inject(PLATFORM_ID);
  private document = inject(DOCUMENT);
  private storageService = inject(StorageService);

  themeMode = signal<ThemeMode>('system');
  systemPrefersDark = signal<boolean>(false);

  // Computed state for UI consumption
  currentMode = signal<'light' | 'dark'>('light');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // React to changes - moved to constructor to ensure proper injection context
      effect(() => {
        const mode = this.themeMode();
        const systemDark = this.systemPrefersDark();
        this.updateTheme();
      });

      this.initializeTheme();
    }
  }

  private async initializeTheme(): Promise<void> {
    // Get initial system preference
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    this.systemPrefersDark.set(mediaQuery.matches);

    // Listen for system changes
    mediaQuery.addEventListener('change', (e) => {
      this.systemPrefersDark.set(e.matches);
      this.updateTheme();
    });

    // Load saved theme
    const savedTheme = await this.storageService.getItem('theme-mode');
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme as ThemeMode)) {
      this.themeMode.set(savedTheme as ThemeMode);
    }
  }

  private async updateTheme(): Promise<void> {
    const mode = this.themeMode();
    const systemDark = this.systemPrefersDark();

    const shouldBeDark = mode === 'dark' || (mode === 'system' && systemDark);

    this.currentMode.set(shouldBeDark ? 'dark' : 'light');

    if (shouldBeDark) {
      this.document.documentElement.classList.add('dark');
    } else {
      this.document.documentElement.classList.remove('dark');
    }

    await this.storageService.setItem('theme-mode', mode);
  }

  async setThemeMode(mode: ThemeMode): Promise<void> {
    this.themeMode.set(mode);
    await this.updateTheme();
  }

  async cycleTheme(): Promise<void> {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    const currentMode = this.themeMode();
    const nextIndex = (modes.indexOf(currentMode) + 1) % modes.length;
    await this.setThemeMode(modes[nextIndex]);
  }
}
