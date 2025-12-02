import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type Language = 'polish' | 'spanish'

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private platformId = inject(PLATFORM_ID);

  // Supported native languages with their ISO codes
  private supportedLanguages: Record<string, Language> = {
    'pl': 'polish',
    'es': 'spanish'
  };

  // Current native language
  private _nativeLanguage = signal<Language>('polish');

  get nativeLanguage() {
    return this._nativeLanguage();
  }

  set nativeLanguage(language: Language) {
    this._nativeLanguage.set(language);
    if (isPlatformBrowser(this.platformId)) {
      localStorage.setItem('nativeLanguage', language);
    }
  }

  get nativeLanguageSignal() {
    return this._nativeLanguage;
  }

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      // Load from localStorage or detect from browser
      const savedLanguage = localStorage.getItem('nativeLanguage') as Language;
      if (savedLanguage && Object.values(this.supportedLanguages).includes(savedLanguage)) {
        this._nativeLanguage.set(savedLanguage);
      } else {
        // Detect browser language
        const browserLang = navigator.language.split('-')[0]; // Get primary language code
        const detectedLanguage = this.supportedLanguages[browserLang] || 'polish'; // Default to Polish
        this._nativeLanguage.set(detectedLanguage);
      }
    }
  }

  // Get display name for a language
  getLanguageDisplayName(language: Language): string {
    const names: Record<Language, string> = {
      polish: 'Polski',
      spanish: 'Español',
    };
    return names[language];
  }

  // Get all supported languages
  getSupportedLanguages(): Language[] {
    return Object.values(this.supportedLanguages);
  }
}
