import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type SupportedLanguage = 'pl' | 'es';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly LANGUAGE_KEY = 'nativeLanguage';

  // Current native language signal
  readonly currentLanguage = signal<SupportedLanguage>('pl');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeLanguage();
    }
  }

  /**
   * Initialize native language from localStorage or auto-detect.
   * This controls which language appears as translations on flashcards.
   * UI remains in English.
   */
  private initializeLanguage(): void {
    const saved = localStorage.getItem(this.LANGUAGE_KEY) as SupportedLanguage;
    if (saved && this.isValidLanguage(saved)) {
      this.currentLanguage.set(saved);
    } else {
      const detected = this.detectBrowserLanguage();
      this.currentLanguage.set(detected);
      localStorage.setItem(this.LANGUAGE_KEY, detected);
    }
  }

  /**
   * Detects user's native language from browser settings.
   * Used to show appropriate translations when learning English business terms.
   * @returns Native language code: 'pl' (Polish), 'es' (Spanish), defaults to 'pl'
   */
  private detectBrowserLanguage(): SupportedLanguage {
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'es') return 'es';
    return 'pl'; // default fallback
  }

  /**
   * Set the native language for flashcard translations.
   * @param language The language code ('pl' or 'es')
   */
  setLanguage(language: SupportedLanguage): void {
    if (this.isValidLanguage(language)) {
      this.currentLanguage.set(language);
      if (isPlatformBrowser(this.platformId)) {
        localStorage.setItem(this.LANGUAGE_KEY, language);
      }
    }
  }

  /**
   * Check if a language code is valid.
   */
  private isValidLanguage(language: string): language is SupportedLanguage {
    return language === 'pl' || language === 'es';
  }

  /**
   * Get the display name for a language code.
   */
  getLanguageDisplayName(language: SupportedLanguage): string {
    switch (language) {
      case 'pl': return 'Polski';
      case 'es': return 'Español';
      default: return 'Polski';
    }
  }

  /**
   * Get native display name for a language (in the language's native script).
   * @deprecated Use getLanguageDisplayName instead
   */
  getNativeLanguageDisplayName(language: SupportedLanguage): string {
    return this.getLanguageDisplayName(language);
  }

  /**
   * Get all supported languages.
   */
  getSupportedLanguages(): SupportedLanguage[] {
    return ['pl', 'es'];
  }
}
