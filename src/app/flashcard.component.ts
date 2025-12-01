import { ChangeDetectionStrategy, Component, signal, computed, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GameStore } from './game-store';

@Component({
  selector: 'app-flashcard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './flashcard.component.html',
  styleUrls: ['./flashcard.component.css']
})
export class FlashcardComponent {
  store = inject(GameStore);
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
    return config.layout.dataMap.primary === 'english' ? 'English' : 'Polish';
  });

  displayFrontText = computed(() => {
    if (this.frontText()) return this.frontText()!;
    const card = this.store.currentCard();
    const config = this.store.currentRoundConfig();
    if (!card || !config) return '';
    const field = config.layout.dataMap.primary;
    return field === 'english' ? card.english : card.polish;
  });

  displayBackLabel = computed(() => {
    if (this.backLabel()) return this.backLabel()!;
    const config = this.store.currentRoundConfig();
    if (!config) return 'Back';
    return config.layout.dataMap.secondary === 'english' ? 'English' : 'Polish';
  });

  displayBackText = computed(() => {
    if (this.backText()) return this.backText()!;
    const card = this.store.currentCard();
    const config = this.store.currentRoundConfig();
    if (!card || !config) return '';
    const field = config.layout.dataMap.secondary;
    return field === 'english' ? card.english : card.polish;
  });

  flip() {
    this.isFlipped.update(v => !v);
  }

  resetFlip() {
    this.isFlipped.set(false);
  }
}
