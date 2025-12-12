import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStore } from '../../game-store';
import { VocabularyStatsService } from '../../services/vocabulary-stats.service';
import { GameService } from '../../services/game.service';
import { FreemiumService } from '../../services/freemium.service';

@Component({
  selector: 'app-summary',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './summary.component.html',
  styleUrl: './summary.component.css'
})
export class SummaryComponent {
  store = inject(GameStore);
  router = inject(Router);
  statsService = inject(VocabularyStatsService);

  // Get unique mastered words count from stats (not from graduatePile which can have duplicates)
  sessionStats = computed(() => {
    const initialDeck = this.store.initialSessionDeck();
    const skippedIds = new Set(this.store.skippedPile().map(c => c.id));

    // Count unique words that were in the session and are now mastered
    const uniqueWordsInSession = new Set(initialDeck.map(c => `${c.english}|${c.category}`));
    const allStats = this.statsService.getAllStats();
    const masteredInSession = allStats.filter(stat =>
      uniqueWordsInSession.has(`${stat.english}|${stat.category}`) &&
      stat.masteryLevel >= 4
    ).length;

    // Needs learning = words that need practice (non-graduated, non-skipped)
    const needsLearning = initialDeck.length - masteredInSession - skippedIds.size;

    return {
      totalCards: initialDeck.length,
      mastered: masteredInSession,
      needsLearning
    };
  });

  gameService = inject(GameService);
  freemiumService = inject(FreemiumService);

  startNewSession() {
    // Get the session config from the store
    const config = this.store.sessionConfig();
    if (config) {
      // Restart the game with the same configuration to get a fresh deck
      this.gameService.startGame(
        config.category,
        config.practiceMode as any,
        config.gameMode,
        config.difficulty
      ).then(() => {
        this.router.navigate(['/game']);
      }).catch(error => {
        console.error('[SummaryComponent] Failed to restart game:', error);
        if (error instanceof Error && error.message === 'FREEMIUM_LIMIT_EXHAUSTED') {
          this.store.reset();
          this.router.navigate(['/paywall']);
        } else {
          // Fallback to menu if there's an error
          this.store.reset();
          this.router.navigate(['/']);
        }
      });
    } else {
      // Fallback to menu if no config is available
      this.store.reset();
      this.router.navigate(['/']);
    }
  }

  backToHome() {
    this.store.reset();
    this.router.navigate(['/']);
  }
}
