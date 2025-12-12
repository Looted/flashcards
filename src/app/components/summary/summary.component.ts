import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStore } from '../../game-store';
import { VocabularyStatsService } from '../../services/vocabulary-stats.service';
import { GameService } from '../../services/game.service';
import { FreemiumService } from '../../services/freemium.service';
import { GameMode } from '../../shared/constants';

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

  // Get mode-aware session statistics
  sessionStats = computed(() => {
    const initialDeck = this.store.initialSessionDeck();
    const skippedIds = new Set(this.store.skippedPile().map(c => c.id));
    const config = this.store.sessionConfig();
    const isNewWordsMode = config?.practiceMode === ('new' as any);

    // Count words that were successfully completed in this session (graduated)
    const wordsLearnedInSession = this.store.graduatePile().length;

    // For Review mode, also calculate mastered words (reached highest level)
    let masteredInSession = 0;
    if (!isNewWordsMode) {
      const uniqueWordsInSession = new Set(initialDeck.map(c => `${c.english}|${c.category}`));
      const allStats = this.statsService.getAllStats();
      masteredInSession = allStats.filter(stat =>
        uniqueWordsInSession.has(`${stat.english}|${stat.category}`) &&
        stat.masteryLevel >= 4
      ).length;
    }

    // Needs learning = words that need practice (non-graduated, non-skipped)
    const needsLearning = initialDeck.length - wordsLearnedInSession - skippedIds.size;

    return {
      totalCards: initialDeck.length,
      wordsLearned: wordsLearnedInSession,
      mastered: masteredInSession,
      needsLearning,
      isNewWordsMode: isNewWordsMode || false
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
