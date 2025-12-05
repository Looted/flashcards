import { Component, input, output, inject, HostListener, computed, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { LanguageService, SupportedLanguage } from '../../services/language.service';
import { AuthService } from '../../services/auth.service';
import { EmailSigninModal } from '../email-signin-modal/email-signin-modal';

@Component({
  selector: 'app-settings-menu',
  standalone: true,
  imports: [CommonModule, EmailSigninModal],
  templateUrl: './settings-menu.html',
  styleUrl: './settings-menu.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsMenu {
  themeService = inject(ThemeService);
  languageService = inject(LanguageService);
  authService = inject(AuthService);

  // Input signal for menu open state
  isOpen = input.required<boolean>();

  // Output event for closing menu
  closeMenu = output<void>();

  // Computed signals for display
  supportedLanguages = computed(() => this.languageService.getSupportedLanguages());
  currentLanguage = computed(() => this.languageService.currentLanguage());
  currentThemeMode = computed(() => this.themeService.themeMode());
  currentLanguageName = computed(() => {
    const current = this.languageService.currentLanguage();
    return this.languageService.getLanguageDisplayName(current);
  });

  // Auth-related computed signals
  authStatus = computed(() => this.authService.authStatus());
  currentUser = computed(() => this.authService.currentUser());
  isAuthenticated = computed(() => this.authService.isAuthenticated());
  isMigrating = computed(() => this.authService.isMigrating());

  userDisplayInfo = computed(() => {
    const user = this.currentUser();
    if (!user) return null;
    return {
      displayName: user.displayName || user.email?.split('@')[0] || 'User',
      email: user.email,
      photoURL: user.photoURL
    };
  });

  // Host listener for escape key
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: Event) {
    if (this.isOpen()) {
      (event as KeyboardEvent).preventDefault();
      this.closeMenu.emit();
    }
  }

  // Methods
  onThemeCycle() {
    this.themeService.cycleTheme();
  }

  getThemeIcon(): string {
    const mode = this.currentThemeMode();
    switch (mode) {
      case 'light': return '☀️';
      case 'dark': return '🌙';
      case 'system': return '💻';
      default: return '💻';
    }
  }

  onLanguageChange(language: SupportedLanguage) {
    this.languageService.setLanguage(language);
  }

  getLanguageDisplayName(language: SupportedLanguage): string {
    return this.languageService.getLanguageDisplayName(language);
  }

  onLanguageClick() {
    // Close menu - mobile users can use the language switcher in header
    this.closeMenu.emit();
  }

  // Auth methods
  showSignInOptions = signal(false);
  showEmailSignInModal = signal(false);

  async onSignInClick() {
    this.showSignInOptions.set(true);
  }

  async onGoogleSignInClick() {
    try {
      await this.authService.signInWithGoogle();
      this.closeMenu.emit();
    } catch (error) {
      console.error('Google sign in failed:', error);
      // TODO: Show error message to user
    }
  }

  onEmailSignInClick() {
    this.showEmailSignInModal.set(true);
  }

  onEmailSignInModalClose() {
    this.showEmailSignInModal.set(false);
  }

  onEmailSignedIn() {
    this.showEmailSignInModal.set(false);
    this.closeMenu.emit();
  }

  async onSignOutClick() {
    try {
      await this.authService.signOut();
      this.closeMenu.emit();
    } catch (error) {
      console.error('Sign out failed:', error);
    }
  }

  // Other methods
  onUserProfileClick() {
    // Could expand to show more detailed profile view
    console.log('User profile clicked');
  }

  onAboutClick() {
    // TODO: Navigate to about page
    console.log('About clicked');
  }

  onPrivacyClick() {
    // TODO: Navigate to privacy page
    console.log('Privacy clicked');
  }
}
