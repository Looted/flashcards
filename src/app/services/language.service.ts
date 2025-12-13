import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { StorageService } from './storage.service';

export type SupportedLanguage = 'pl' | 'es' | 'de' | 'fr';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private readonly platformId = inject(PLATFORM_ID);
  private readonly storageService = inject(StorageService);
  private readonly LANGUAGE_KEY = 'nativeLanguage';

  // Current native language signal
  readonly currentLanguage = signal<SupportedLanguage>('pl');

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initializeLanguage();
    }
  }

  /**
   * Initialize native language from storage or auto-detect.
   * This controls which language appears as translations on flashcards.
   * UI remains in English.
   */
  private async initializeLanguage(): Promise<void> {
    const saved = await this.storageService.getItem(this.LANGUAGE_KEY);
    if (saved && this.isValidLanguage(saved as SupportedLanguage)) {
      this.currentLanguage.set(saved as SupportedLanguage);
    } else {
      const detected = this.detectBrowserLanguage();
      this.currentLanguage.set(detected);
      await this.storageService.setItem(this.LANGUAGE_KEY, detected);
    }
  }

  /**
   * Detects user's native language from browser settings.
   * Used to show appropriate translations when learning English business terms.
   * @returns Native language code: 'pl' (Polish), 'es' (Spanish), 'de' (German), 'fr' (French), defaults to 'pl'
   */
  private detectBrowserLanguage(): SupportedLanguage {
    const browserLang = navigator.language.split('-')[0];
    if (browserLang === 'es') return 'es';
    if (browserLang === 'de') return 'de';
    if (browserLang === 'fr') return 'fr';
    return 'pl'; // default fallback
  }

  /**
   * Set the native language for flashcard translations.
   * @param language The language code ('pl' or 'es')
   */
  async setLanguage(language: SupportedLanguage): Promise<void> {
    if (this.isValidLanguage(language)) {
      this.currentLanguage.set(language);
      if (isPlatformBrowser(this.platformId)) {
        await this.storageService.setItem(this.LANGUAGE_KEY, language);
      }
    }
  }

  /**
   * Check if a language code is valid.
   */
  private isValidLanguage(language: string): language is SupportedLanguage {
    return ['pl', 'es', 'de', 'fr'].includes(language);
  }

  /**
   * Get the display name for a language code.
   */
  getLanguageDisplayName(language: SupportedLanguage): string {
    switch (language) {
      case 'pl': return 'Polski';
      case 'es': return 'Español';
      case 'de': return 'Deutsch';
      case 'fr': return 'Français';
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
    return ['pl', 'es', 'de', 'fr'];
  }
}
