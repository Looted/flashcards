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
  definition: string;
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
  initialSessionDeck = signal<Flashcard[]>([]); // New signal to store the original deck for the session
  activeDeck = signal<Flashcard[]>([]);
  queue = signal<GameCard[]>([]);
  graduatePile = signal<Flashcard[]>([]);
  skippedPile = signal<Flashcard[]>([]);

  // Round-specific progress signals
  roundInitialQueueSize = signal<number>(0);
  roundGraduatedCount = signal<number>(0);

  // Round intro state
  roundIntroShown = signal<boolean>(false);

  currentCard = computed(() => this.queue()[0]?.flashcard || null);

  currentRoundConfig = computed(() => {
    const mode = this.activeMode();
    if (!mode) return null;
    return mode.rounds[this.roundIndex()] || null;
  });

  progress = computed(() => {
    // Progress is now based on the current round's initial queue size and graduated count
    const total = this.roundInitialQueueSize();
    const done = this.roundGraduatedCount();
    return total === 0 ? 0 : (done / total) * 100;
  });

  startGame(mode: GameMode, cards: Flashcard[]) {
    this.activeMode.set(mode);
    this.roundIndex.set(0);
    this.initialSessionDeck.set(cards); // Store the original cards for the session
    this.skippedPile.set([]); // Ensure skippedPile is clear for a new game

    this.activeDeck.set(cards);
    this.queue.set(cards.map(c => ({ flashcard: c, successCount: 0 })));
    this.graduatePile.set([]);

    // Initialize round-specific progress signals
    this.roundInitialQueueSize.set(cards.length);
    this.roundGraduatedCount.set(0);
    // Initialize round intro state
    this.roundIntroShown.set(false);

    this.phase.set("PLAYING");
  }

  submitAnswer(success: boolean) {
    const card = this.queue()[0];
    if (!card) return;

    this.queue.update(q => q.slice(1));

    // Record the encounter in stats
    const languageField = this.mapLanguageToField(this.languageService.currentLanguage());
    const nativeTranslation = card.flashcard.translations[languageField] || card.flashcard.translations.polish || '';
    this.statsService.recordEncounter(card.flashcard.english, nativeTranslation, card.flashcard.category, success);

    if (success) {
      card.successCount++;
      if (card.successCount >= this.currentRoundConfig()!.completionCriteria.requiredSuccesses) {
        this.graduatePile.update(p => [...p, card.flashcard]);
        // Update round-specific progress
        this.roundGraduatedCount.update(c => c + 1);
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
    const languageField = this.mapLanguageToField(this.languageService.currentLanguage());
    const nativeTranslation = card.flashcard.translations[languageField] || card.flashcard.translations.polish || '';
    this.statsService.markAsSkipped(card.flashcard.english, nativeTranslation, card.flashcard.category);

    // Add to skippedPile
    this.skippedPile.update(p => [...p, card.flashcard]);

    // Update activeDeck to reflect the skipped card (no longer available for subsequent rounds)
    this.activeDeck.update(deck => deck.filter(c => c.id !== card.flashcard.id));

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
        this.phase.set("SUMMARY");
        return;
      }

      this.roundIndex.set(nextRound);
      currentRoundIndex = nextRound;
      const config = mode.rounds[currentRoundIndex];

      let sourceCards: Flashcard[];
      const skippedIds = new Set(this.skippedPile().map(c => c.id));

      if (config.inputSource === "deck_start") {
        // Source from the initial session deck, explicitly filtering any currently skipped cards
        sourceCards = this.initialSessionDeck().filter(c => !skippedIds.has(c.id));
      } else if (config.inputSource === "prev_round_failures") {
        const initialDeckForFailures = this.initialSessionDeck(); // Use initialSessionDeck as base
        const graduatedIds = new Set(this.graduatePile().map(c => c.id));
        // Filter out graduated and skipped cards from the initial deck
        sourceCards = initialDeckForFailures.filter(c => !graduatedIds.has(c.id) && !skippedIds.has(c.id));
      } else if (config.inputSource === "prev_round_successes") {
        sourceCards = this.graduatePile().filter(c => !skippedIds.has(c.id));
      } else {
        sourceCards = [];
      }

      const newQueue = sourceCards.map(c => ({ flashcard: c, successCount: 0 }));
      if (newQueue.length > 0) {
        this.queue.set(newQueue);
        // Reset round-specific progress signals for the new round
        this.roundInitialQueueSize.set(newQueue.length);
        this.roundGraduatedCount.set(0);
        // Reset round intro state for the new round
        this.roundIntroShown.set(false);
        break;
      }
      // If queue would be empty, continue to next round
    }
  }

  startNewGame() {
    // When starting a new game, reset progress, but preserve skipped cards to maintain permanent exclusion
    this.roundIndex.set(0);
    // Do NOT clear skippedPile - skipped cards should remain permanently excluded

    // Filter out skipped cards from the initial session deck
    const skippedIds = new Set(this.skippedPile().map(c => c.id));
    const filteredDeck = this.initialSessionDeck().filter(c => !skippedIds.has(c.id));

    this.activeDeck.set(filteredDeck);
    this.queue.set(filteredDeck.map(c => ({ flashcard: c, successCount: 0 })));
    this.graduatePile.set([]);

    // Initialize round-specific progress signals
    this.roundInitialQueueSize.set(filteredDeck.length);
    this.roundGraduatedCount.set(0);
    // Initialize round intro state
    this.roundIntroShown.set(false);

    this.phase.set("PLAYING");
  }

  reset() {
    this.phase.set("MENU");
    this.activeMode.set(null);
    this.roundIndex.set(0);
    this.initialSessionDeck.set([]); // Clear the original deck too
    this.activeDeck.set([]);
    this.queue.set([]);
    this.graduatePile.set([]);
    this.skippedPile.set([]);
    // Reset round-specific progress signals
    this.roundInitialQueueSize.set(0);
    this.roundGraduatedCount.set(0);
  }

  /**
   * Maps the new language codes to the old LanguageField types ('polish', 'spanish')
   */
  private mapLanguageToField(language: string): LanguageField {
    switch (language) {
      case 'pl': return 'polish';
      case 'es': return 'spanish';
      case 'en':
      case 'de':
      case 'fr':
      default: return 'polish'; // fallback to polish for unsupported languages
    }
  }
}
