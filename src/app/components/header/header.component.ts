import { Component, Input, inject, signal, computed, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PwaService } from '../../services/pwa.service';
import { ThemeService, ThemeMode } from '../../services/theme.service';
import { EnvironmentService } from '../../services/environment.service';
import { AuthService } from '../../services/auth.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';
import { SettingsMenu } from '../settings-menu/settings-menu';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LanguageSwitcherComponent, SettingsMenu],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnDestroy {
  pwaService = inject(PwaService);
  themeService = inject(ThemeService);
  router = inject(Router);
  environmentService = inject(EnvironmentService);
  authService = inject(AuthService);

  // Developer controls
  showDevControls = signal(false);
  useStatic = signal(true); // Default to static mode

  // Computed signal for AI toggle visibility
  showAiToggle = computed(() => this.showDevControls() && this.environmentService.isAiModeEnabled);

  // Settings menu state
  showMenu = signal(false);

  // Computed signals
  isDarkMode = computed(() => this.themeService.currentMode() === 'dark');

  // Auth-related computed signals
  isAuthenticated = computed(() => this.authService.isAuthenticated());
  userDisplayInfo = computed(() => this.authService.getUserDisplayInfo());



  private readonly TRIPLE_CLICK_THRESHOLD = 3;
  private readonly CLICK_TIMEOUT_MS = 500;
  private logoClickCount = 0;
  private logoClickTimeout: ReturnType<typeof setTimeout> | null = null;

  onInstallClick() {
    this.pwaService.installPWA();
  }

  onThemeToggle() {
    this.themeService.cycleTheme();
  }

  getThemeIcon(): string {
    const mode = this.themeService.themeMode();
    switch (mode) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'system': return '💻';
      default: return '💻';
    }
  }

  onLogoClick() {
    // Triple-click on logo to show/hide developer controls
    this.logoClickCount++;
    if (this.logoClickTimeout) {
      clearTimeout(this.logoClickTimeout);
    }

    this.logoClickTimeout = setTimeout(() => {
      this.logoClickCount = 0;
    }, this.CLICK_TIMEOUT_MS);

    if (this.logoClickCount === this.TRIPLE_CLICK_THRESHOLD) {
      this.showDevControls.set(!this.showDevControls());
      this.logoClickCount = 0;
    } else {
      this.router.navigate(['/']);
    }
  }

  ngOnDestroy() {
    if (this.logoClickTimeout) {
      clearTimeout(this.logoClickTimeout);
    }
  }

  onAIToggleChange(event: Event) {
    const checked = (event.target as HTMLInputElement).checked;
    this.useStatic.set(!checked);
  }

  toggleMenu() {
    this.showMenu.set(!this.showMenu());
  }

  closeMenu() {
    this.showMenu.set(false);
  }
}
