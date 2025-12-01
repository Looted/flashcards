import { Injectable, signal, computed, inject } from '@angular/core';
import { VocabularyStatsService } from './services/vocabulary-stats.service';
import { GameMode, LanguageField } from './core/models/game-config.model';
import { LanguageService } from './services/language.service';

// --- MODELS ---
export interface Flashcard {
  id: string;
  english: string;
  translations: Partial<Record<LanguageField, string>>;
  category: string;
  masteryLevel: number;
}

export interface GameCard {
  flashcard: Flashcard;
  successCount: number;
}

export type GamePhase = 'MENU' | 'PLAYING' | 'SUMMARY';

// --- GAME STORE SERVICE (Signals) ---
@Injectable({ providedIn: 'root' })
export class GameStore {
  private statsService = inject(VocabularyStatsService);
  private languageService = inject(LanguageService);

  // State Signals
  phase = signal<GamePhase>('MENU');
  activeMode = signal<GameMode | null>(null);
  roundIndex = signal<number>(0);
  activeDeck = signal<Flashcard[]>([]);
  queue = signal<GameCard[]>([]);
  graduatePile = signal<Flashcard[]>([]);

  currentCard = computed(() => this.queue()[0]?.flashcard || null);

  currentRoundConfig = computed(() => {
    const mode = this.activeMode();
    if (!mode) return null;
    return mode.rounds[this.roundIndex()] || null;
  });

  progress = computed(() => {
    const total = this.activeDeck().length;
    const done = this.graduatePile().length;
    return total === 0 ? 0 : (done / total) * 100;
  });

  startGame(mode: GameMode, cards: Flashcard[]) {
    this.activeMode.set(mode);
    this.roundIndex.set(0);
    this.activeDeck.set(cards);
    this.queue.set(cards.map(c => ({ flashcard: c, successCount: 0 })));
    this.graduatePile.set([]);
    this.phase.set('PLAYING');
  }

  submitAnswer(success: boolean) {
    const card = this.queue()[0];
    if (!card) return;

    this.queue.update(q => q.slice(1));

    // Record the encounter in stats
    const nativeTranslation = card.flashcard.translations[this.languageService.nativeLanguage] || card.flashcard.translations.polish || '';
    this.statsService.recordEncounter(card.flashcard.english, nativeTranslation, card.flashcard.category, success);

    if (success) {
      card.successCount++;
      if (card.successCount >= this.currentRoundConfig()!.completionCriteria.requiredSuccesses) {
        this.graduatePile.update(p => [...p, card.flashcard]);
      } else {
        // Re-queue at index + 10 (spaced repetition within session)
        const insertIndex = Math.min(10, this.queue().length);
        this.queue.update(q => [...q.slice(0, insertIndex), card, ...q.slice(insertIndex)]);
      }
    } else {
      // Failure: Re-queue with offset
      const offset = this.currentRoundConfig()!.failureBehavior.params[0];
      const insertIndex = Math.min(offset, this.queue().length);
      this.queue.update(q => [...q.slice(0, insertIndex), card, ...q.slice(insertIndex)]);
    }

    if (this.queue().length === 0) {
      this.advanceRound();
    }
  }

  skipCurrentCard() {
    const card = this.queue()[0];
    if (!card) return;

    this.queue.update(q => q.slice(1));

    // Mark as skipped in stats
    const nativeTranslation = card.flashcard.translations[this.languageService.nativeLanguage] || card.flashcard.translations.polish || '';
    this.statsService.markAsSkipped(card.flashcard.english, nativeTranslation, card.flashcard.category);

    if (this.queue().length === 0) {
      this.advanceRound();
    }
  }

  private advanceRound() {
    const mode = this.activeMode()!;
    let currentRoundIndex = this.roundIndex();

    while (true) {
      const nextRound = currentRoundIndex + 1;
      if (nextRound >= mode.rounds.length) {
        this.phase.set('SUMMARY');
        return;
      }

      this.roundIndex.set(nextRound);
      currentRoundIndex = nextRound;
      const config = mode.rounds[currentRoundIndex];

      let sourceCards: Flashcard[];
      if (config.inputSource === 'deck_start') {
        sourceCards = this.activeDeck();
      } else if (config.inputSource === 'prev_round_failures') {
        const initialDeck = this.activeDeck();
        const graduatedIds = new Set(this.graduatePile().map(c => c.id));
        sourceCards = initialDeck.filter(c => !graduatedIds.has(c.id));
      } else if (config.inputSource === 'prev_round_successes') {
        sourceCards = this.graduatePile();
      } else {
        sourceCards = [];
      }

      const newQueue = sourceCards.map(c => ({ flashcard: c, successCount: 0 }));
      if (newQueue.length > 0) {
        this.queue.set(newQueue);
        break;
      }
      // If queue would be empty, continue to next round
    }
  }

  reset() {
    this.phase.set('MENU');
    this.activeMode.set(null);
    this.roundIndex.set(0);
    this.activeDeck.set([]);
    this.queue.set([]);
    this.graduatePile.set([]);
  }
}
