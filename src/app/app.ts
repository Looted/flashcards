import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { AiWordGenerationService } from './services/ai-word-generation';
import { GameStore, Flashcard } from './game-store';

import { FlashcardComponent } from './flashcard.component';

// 2. MAIN APP COMPONENT
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, FlashcardComponent],
  templateUrl: './app.html',
  styles: [`
    :host { display: block; }
    .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class App {
  store = inject(GameStore);
  llm = inject(AiWordGenerationService);

  isLoading = false;
  inputControl = new FormControl('');
  typingFeedback: { correct: boolean, msg: string } | null = null;

  async selectTopic(topic: string) {
    this.isLoading = true;
    try {
      const cards = await this.llm.generateWords(topic, 3);
      const flashcards: Flashcard[] = cards.map((item, index) => ({
        id: crypto.randomUUID(),
        english: item.english,
        polish: item.polish,
        category: topic,
        masteryLevel: 0
      }));
      this.store.startGame(flashcards);
    } finally {
      this.isLoading = false;
    }
  }

  handleAnswer(correct: boolean, cardComp: FlashcardComponent) {
    cardComp.resetFlip(); // Reset flip first to hide back content
    // Small delay to ensure flip animation completes before advancing
    setTimeout(() => {
      this.store.handleAnswer(correct);
    }, 100);
  }

  checkTyping() {
    if (!this.inputControl.value) return;

    const input = this.inputControl.value.trim().toLowerCase();
    const correct = this.store.currentCard()?.english.toLowerCase();

    if (input === correct) {
      this.typingFeedback = { correct: true, msg: 'Correct!' };
      setTimeout(() => {
        this.store.handleAnswer(true);
        this.inputControl.setValue('');
        this.typingFeedback = null;
      }, 800);
    } else {
      this.typingFeedback = { correct: false, msg: `Incorrect. It was: ${correct}` };
      // User must acknowledge error or we wait a bit longer
      setTimeout(() => {
         this.store.handleAnswer(false);
         this.inputControl.setValue('');
         this.typingFeedback = null;
      }, 2000);
    }
  }
}
