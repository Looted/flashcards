import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { GameStore } from '../../game-store';
import { VocabularyStatsService } from '../../services/vocabulary-stats.service';

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

    // Needs learning = words that were skipped during this session
    const needsLearning = skippedIds.size;

    return {
      totalCards: initialDeck.length,
      mastered: masteredInSession,
      needsLearning
    };
  });

  startNewSession() {
    this.store.startNewGame();
    this.router.navigate(['/game']);
  }

  backToHome() {
    this.store.reset();
    this.router.navigate(['/']);
  }
}
