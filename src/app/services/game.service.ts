import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { AiWordGenerationService } from './ai-word-generation';
import { StaticVocabularyService } from './static-vocabulary.service';
import { VocabularyStatsService } from './vocabulary-stats.service';
import { GameStore, Flashcard } from '../game-store';
import { GameMode, GAME_CONSTANTS } from '../shared/constants';
import { STANDARD_GAME_MODE } from '../core/config/game-modes';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private store = inject(GameStore);
  private llm = inject(AiWordGenerationService);
  private staticVocab = inject(StaticVocabularyService);
  private statsService = inject(VocabularyStatsService);

  async startGame(topic: string, mode: GameMode, useStatic: boolean, difficulty: number | null) {
    let cards: { english: string, polish: string }[];

    if (useStatic && topic === 'HR') {
      const observable = this.staticVocab.generateWords(topic, GAME_CONSTANTS.CARDS_PER_GAME, difficulty ?? undefined);
      cards = await firstValueFrom(observable) || [];
    } else {
      cards = await this.llm.generateWords(topic, GAME_CONSTANTS.CARDS_PER_GAME, undefined, difficulty);
    }

    // Filter cards based on selected mode
    if (mode === GameMode.New) {
      // Show only words never seen before
      cards = cards.filter(card => !this.statsService.getStats(card.english, card.polish));
    } else if (mode === GameMode.Practice) {
      // Show words that need practice from the stats service
      const wordsNeedingPractice = this.statsService.getWordsNeedingPractice()
        .filter(stat => stat.category === topic)
        .slice(0, GAME_CONSTANTS.CARDS_PER_GAME)
        .map(stat => ({ english: stat.english, polish: stat.polish }));
      cards = wordsNeedingPractice;
    }

    const flashcards: Flashcard[] = cards.map((item) => ({
      id: crypto.randomUUID(),
      english: item.english,
      polish: item.polish,
      category: topic,
      masteryLevel: 0
    }));
    this.store.startGame(STANDARD_GAME_MODE, flashcards);
  }

  handleAnswer(correct: boolean) {
    this.store.submitAnswer(correct);
  }

  skipCard() {
    this.store.skipCurrentCard();
  }
}
