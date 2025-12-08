import { ChangeDetectionStrategy, Component, signal, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStore } from '../../../../game-store';
import { LanguageService } from '../../../../services/language.service';

@Component({
  selector: 'app-flashcard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './flashcard.component.html',
  styleUrls: ['./flashcard.component.css']
})
export class FlashcardComponent {
  store = inject(GameStore);
  languageService = inject(LanguageService);
  isFlipped = signal(false);

  // Inputs for when used in CardRenderer
  frontText = input<string>();
  backText = input<string>();
  frontLabel = input<string>();
  backLabel = input<string>();

  displayFrontLabel = computed(() => {
    if (this.frontLabel()) return this.frontLabel()!;
    const config = this.store.currentRoundConfig();
    if (!config) return 'Front';
    const field = config.layout.dataMap.primary;
    if (field === 'english') {
      return 'English';
    } else if (field !== 'contextSentence' && field !== 'translation') {
      const langCode = this.mapFieldToLanguageCode(field);
      return this.languageService.getLanguageDisplayName(langCode);
    }
    return field;
  });

  displayFrontText = computed(() => {
    if (this.frontText()) return this.frontText()!;
    const card = this.store.currentCard();
    const config = this.store.currentRoundConfig();
    if (!card || !config) return '';
    const field = config.layout.dataMap.primary;
    if (field === 'english') {
      return card.english;
    } else if (field !== 'contextSentence' && field !== 'translation') {
      // For native language fields, get the translation
      return card.translations[field] || '';
    }
    return '';
  });

  displayBackLabel = computed(() => {
    if (this.backLabel()) return this.backLabel()!;
    const config = this.store.currentRoundConfig();
    if (!config) return 'Back';
    const field = config.layout.dataMap.secondary;
    if (field === 'english') {
      return 'English';
    } else if (field !== 'contextSentence' && field !== 'translation') {
      const langCode = this.mapFieldToLanguageCode(field);
      return this.languageService.getLanguageDisplayName(langCode);
    }
    return field;
  });

  displayBackText = computed(() => {
    if (this.backText()) return this.backText()!;
    const card = this.store.currentCard();
    const config = this.store.currentRoundConfig();
    if (!card || !config) return '';
    const field = config.layout.dataMap.secondary;
    if (field === 'english') {
      return card.english;
    } else if (field !== 'contextSentence' && field !== 'translation') {
      // For native language fields, get the translation
      return card.translations[field] || '';
    }
    return '';
  });

  textSizeClass = computed(() => {
    const text = this.isFlipped() ? this.displayBackText() : this.displayFrontText();
    const length = text.length;

    if (length > 60) return 'text-lg sm:text-xl md:text-2xl';
    if (length > 40) return 'text-xl sm:text-2xl md:text-3xl';
    return 'text-2xl sm:text-3xl md:text-4xl';
  });

  currentWord = computed(() => {
    const card = this.store.currentCard();
    if (!card) return null;
    return card;
  });

  flip() {
    this.isFlipped.update(v => !v);
  }

  resetFlip() {
    this.isFlipped.set(false);
  }

  /**
   * Maps LanguageField ('polish', 'spanish') to language codes ('pl', 'es')
   */
  private mapFieldToLanguageCode(field: string): 'pl' | 'es' {
    switch (field) {
      case 'polish': return 'pl';
      case 'spanish': return 'es';
      default: return 'pl';
    }
  }
}
