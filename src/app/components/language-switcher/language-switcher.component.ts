import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LanguageService, Language } from '../../services/language.service';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './language-switcher.component.html',
  styleUrls: ['./language-switcher.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LanguageSwitcherComponent {
  private languageService = inject(LanguageService);

  supportedLanguages = computed(() => this.languageService.getSupportedLanguages());
  currentLanguage = this.languageService.nativeLanguageSignal;

  selectLanguage(language: Language) {
    this.languageService.nativeLanguage = language;
  }

  getLanguageDisplayName(language: Language): string {
    return this.languageService.getLanguageDisplayName(language);
  }
}
