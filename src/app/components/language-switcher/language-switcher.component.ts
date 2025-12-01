import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LanguageService, Language } from '../../services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LanguageSwitcherComponent {
  private languageService = inject(LanguageService);

  supportedLanguages = computed(() => this.languageService.getSupportedLanguages());

  get currentLanguage() {
    return this.languageService.nativeLanguage;
  }

  onLanguageChange(event: Event) {
    const target = event.target as HTMLSelectElement;
    this.languageService.nativeLanguage = target.value as Language;
  }

  getLanguageDisplayName(language: Language): string {
    return this.languageService.getLanguageDisplayName(language);
  }
}
