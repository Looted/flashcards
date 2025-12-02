import { Component, Input, Output, EventEmitter, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { PwaService } from '../../services/pwa.service';
import { LanguageSwitcherComponent } from '../language-switcher/language-switcher.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, LanguageSwitcherComponent],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css'
})
export class HeaderComponent implements OnDestroy {
  pwaService = inject(PwaService);
  router = inject(Router);

  @Input() showCardCount = false;
  @Input() currentIndex = 0;
  @Input() totalCards = 0;

  // Developer controls
  showDevControls = signal(false);
  useStatic = signal(true); // Default to static mode

  private readonly TRIPLE_CLICK_THRESHOLD = 3;
  private readonly CLICK_TIMEOUT_MS = 500;
  private logoClickCount = 0;
  private logoClickTimeout: ReturnType<typeof setTimeout> | null = null;

  onInstallClick() {
    this.pwaService.installPWA();
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
    this.useStatic.set(!checked); // checked=true means AI on, so useStatic=false
  }
}
