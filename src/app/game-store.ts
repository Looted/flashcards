import { Injectable, signal, computed, inject } from '@angular/core';
import { VocabularyStatsService } from './services/vocabulary-stats.service';

// --- MODELS ---
export interface Flashcard {
  id: string;
  english: string;
  polish: string;
  category: string;
  masteryLevel: number;
}

export type GamePhase = 'MENU' | 'PLAYING' | 'SUMMARY';
export type RoundType = 'RECOGNIZE_EN' | 'RECOGNIZE_PL' | 'WRITE_EN';

// --- GAME STORE SERVICE (Signals) ---
@Injectable({ providedIn: 'root' })
export class GameStore {
  private statsService = inject(VocabularyStatsService);

  // State Signals
  phase = signal<GamePhase>('MENU');
  currentRound = signal<RoundType>('RECOGNIZE_EN');

  activeDeck = signal<Flashcard[]>([]);
  currentIndex = signal<number>(0);

  // Track wrong answers to repeat them
  wrongAnswers = signal<string[]>([]);

  currentCard = computed(() => {
    const deck = this.activeDeck();
    const idx = this.currentIndex();
    return deck.length > idx ? deck[idx] : null;
  });

  progress = computed(() => {
    const total = this.activeDeck().length;
    const current = this.currentIndex() + 1; // +1 because we're showing progress through current card
    return total === 0 ? 0 : (current / total) * 100;
  });

  startGame(cards: Flashcard[]) {
    this.activeDeck.set(cards);
    this.currentIndex.set(0);
    this.wrongAnswers.set([]);
    this.currentRound.set('RECOGNIZE_EN'); // Start with Round 1
    this.phase.set('PLAYING');
  }

  handleAnswer(correct: boolean) {
    const card = this.currentCard();
    if (!card) return;

    // Record the encounter in stats
    this.statsService.recordEncounter(card.english, card.polish, card.category, correct);

    if (!correct) {
      this.wrongAnswers.update(ids => [...ids, card.id]);
    }

    const nextIndex = this.currentIndex() + 1;
    if (nextIndex < this.activeDeck().length) {
      this.currentIndex.set(nextIndex);
    } else {
      this.advanceRound();
    }
  }

  skipCurrentCard() {
    const card = this.currentCard();
    if (!card) return;

    // Mark as skipped in stats (persists to local storage)
    this.statsService.markAsSkipped(card.english, card.polish, card.category);

    // Remove from active deck
    this.activeDeck.update(deck => deck.filter(c => c.id !== card.id));

    // If we removed the last card, index might be out of bounds, so adjust if needed
    // But usually we want to stay at the same index (which is now the next card)
    // unless we were at the end.
    const currentDeck = this.activeDeck();
    const currentIdx = this.currentIndex();

    if (currentDeck.length === 0) {
      // Deck is empty, advance round or end game
      this.advanceRound();
    } else if (currentIdx >= currentDeck.length) {
      // We were at the last card, so we are now out of bounds.
      // But since we removed the card, we should probably just check if we need to advance.
      // If we are at the end of the list, we advance.
      this.advanceRound();
    }
    // If we are not at the end, currentIndex now points to the next card, which is correct.
  }

  private advanceRound() {
    const current = this.currentRound();
    if (current === 'RECOGNIZE_EN') {
      this.currentRound.set('RECOGNIZE_PL');
      this.currentIndex.set(0);
    } else if (current === 'RECOGNIZE_PL') {
      this.currentRound.set('WRITE_EN');
      this.currentIndex.set(0);
    } else {
      this.phase.set('SUMMARY');
    }
  }

  reset() {
    this.phase.set('MENU');
    this.activeDeck.set([]);
    this.currentIndex.set(0);
    this.wrongAnswers.set([]);
    this.currentRound.set('RECOGNIZE_EN');
  }
}
