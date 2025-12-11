import { Injectable, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { StaticVocabularyService } from './static-vocabulary.service';
import { VocabularyStatsService } from './vocabulary-stats.service';
import { GameStore, Flashcard } from '../game-store';
import { GameMode, GAME_CONSTANTS } from '../shared/constants';
import { GameModeService, GameModeType } from './game-mode.service';
import { LanguageService } from './language.service';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private store = inject(GameStore);
  private staticVocab = inject(StaticVocabularyService);
  private statsService = inject(VocabularyStatsService);
  private gameModeService = inject(GameModeService);
  private languageService = inject(LanguageService);

  async startGame(topic: string, practiceMode: GameMode, gameModeType: GameModeType, difficulty: number | null) {
    let cards: { english: string, translations: Record<string, string> }[];

    // Determine word count based on game mode
    const wordCount = gameModeType === 'blitz'
      ? GAME_CONSTANTS.BLITZ_WORD_COUNT
      : GAME_CONSTANTS.CLASSIC_WORD_COUNT;

    console.log('[GameService] startGame called:', { topic, practiceMode, gameModeType, difficulty, wordCount });

    const topicLower = topic.toLowerCase();
    console.log('[GameService] Using static vocabulary for topic:', topicLower);

    // Always use static vocabulary
    try {
      const languageField = this.mapLanguageCodeToName(this.languageService.currentLanguage());
      console.log('[GameService] Loading translated vocabulary for:', topicLower, 'with language:', languageField);
      const observable = this.staticVocab.generateTranslatedWords(topicLower, languageField, wordCount, difficulty ?? undefined);
      cards = await firstValueFrom(observable) || [];
      console.log('[GameService] Translated vocabulary loaded:', cards.length, 'cards');
    } catch (error) {
      console.error('[GameService] Failed to load translated vocabulary, using fallback:', error);
      // Use static fallback words as safety net
      cards = this.getStaticFallbackWords(topic, wordCount, difficulty);
    }

    console.log('[GameService] Total cards before filtering:', cards.length);

    // Filter cards based on selected practice mode
    if (practiceMode === GameMode.New) {
      // Show only words never seen before
      cards = cards.filter(card => !this.statsService.getStats(card.english));
    } else if (practiceMode === GameMode.Practice) {
      // Show words that need practice from the stats service
      const practiceWords = new Set(this.statsService.getWordsNeedingPractice()
        .filter(stat => stat.category === topic)
        .map(s => s.english.toLowerCase()));

      cards = cards.filter(c => practiceWords.has(c.english.toLowerCase()))
                   .slice(0, wordCount);
    }

    const flashcards: Flashcard[] = cards.map((item) => {
      // Always use English definition from the base file (e.g., hr_en.json)
      // Never use translated definitions
      let definition = '';
      if (item.translations['definition_english']) {
        definition = item.translations['definition_english'];
      }

      return {
        id: crypto.randomUUID(),
        english: item.english,
        translations: item.translations,
        category: topic,
        masteryLevel: 0,
        definition: definition
      };
    });
    this.store.startGame(this.gameModeService.getGameMode(gameModeType), flashcards);
  }

  handleAnswer(correct: boolean) {
    this.store.submitAnswer(correct);
  }

  skipCard() {
    this.store.skipCurrentCard();
  }

  private getStaticFallbackWords(theme: string, count: number, difficulty: number | null): { english: string, translations: Record<string, string> }[] {
    // Fallback words organized by theme with difficulty levels
    const fallbackThemes: Record<string, { english: string, polish: string, difficulty: number }[]> = {
      'IT': [
        { english: 'computer', polish: 'komputer', difficulty: 1 },
        { english: 'software', polish: 'oprogramowanie', difficulty: 1 },
        { english: 'internet', polish: 'internet', difficulty: 1 },
        { english: 'database', polish: 'baza danych', difficulty: 2 },
        { english: 'algorithm', polish: 'algorytm', difficulty: 2 },
        { english: 'network', polish: 'sieć', difficulty: 2 },
        { english: 'server', polish: 'serwer', difficulty: 2 },
        { english: 'browser', polish: 'przeglądarka', difficulty: 1 },
        { english: 'keyboard', polish: 'klawiatura', difficulty: 1 },
        { english: 'mouse', polish: 'mysz', difficulty: 1 },
      ],
      'hr': [
        { english: 'employee', polish: 'pracownik', difficulty: 1 },
        { english: 'manager', polish: 'menedżer', difficulty: 1 },
        { english: 'interview', polish: 'wywiad', difficulty: 2 },
        { english: 'salary', polish: 'wynagrodzenie', difficulty: 2 },
        { english: 'recruitment', polish: 'rekrutacja', difficulty: 3 },
        { english: 'benefits', polish: 'świadczenia', difficulty: 2 },
        { english: 'performance', polish: 'wydajność', difficulty: 2 },
        { english: 'training', polish: 'szkolenie', difficulty: 2 },
        { english: 'contract', polish: 'umowa', difficulty: 2 },
        { english: 'vacation', polish: 'urlop', difficulty: 1 },
      ],
      'pm': [
        { english: 'meeting', polish: 'spotkanie', difficulty: 1 },
        { english: 'project', polish: 'projekt', difficulty: 1 },
        { english: 'budget', polish: 'budżet', difficulty: 2 },
        { english: 'strategy', polish: 'strategia', difficulty: 2 },
        { english: 'deadline', polish: 'termin', difficulty: 2 },
        { english: 'presentation', polish: 'prezentacja', difficulty: 2 },
        { english: 'client', polish: 'klient', difficulty: 1 },
        { english: 'profit', polish: 'zysk', difficulty: 2 },
        { english: 'investment', polish: 'inwestycja', difficulty: 3 },
        { english: 'partnership', polish: 'partnerstwo', difficulty: 2 },
      ],
      'Business': [
        { english: 'meeting', polish: 'spotkanie', difficulty: 1 },
        { english: 'project', polish: 'projekt', difficulty: 1 },
        { english: 'budget', polish: 'budżet', difficulty: 2 },
        { english: 'strategy', polish: 'strategia', difficulty: 2 },
        { english: 'deadline', polish: 'termin', difficulty: 2 },
        { english: 'presentation', polish: 'prezentacja', difficulty: 2 },
        { english: 'client', polish: 'klient', difficulty: 1 },
        { english: 'profit', polish: 'zysk', difficulty: 2 },
        { english: 'investment', polish: 'inwestycja', difficulty: 3 },
        { english: 'partnership', polish: 'partnerstwo', difficulty: 2 },
      ],
      'Medical': [
        { english: 'doctor', polish: 'lekarz', difficulty: 1 },
        { english: 'patient', polish: 'pacjent', difficulty: 1 },
        { english: 'medicine', polish: 'lek', difficulty: 1 },
        { english: 'hospital', polish: 'szpital', difficulty: 1 },
        { english: 'diagnosis', polish: 'diagnoza', difficulty: 2 },
        { english: 'treatment', polish: 'leczenie', difficulty: 2 },
        { english: 'symptom', polish: 'objaw', difficulty: 2 },
        { english: 'prescription', polish: 'recepta', difficulty: 2 },
        { english: 'appointment', polish: 'wizyta', difficulty: 1 },
        { english: 'emergency', polish: 'nagły wypadek', difficulty: 2 },
      ]
    };

    let words = fallbackThemes[theme] || fallbackThemes['IT'];

    // Filter by difficulty if specified
    if (difficulty !== null) {
      words = words.filter(word => word.difficulty === difficulty);
    }

    // If no words match the difficulty, fall back to all words for this theme
    if (words.length === 0) {
      words = fallbackThemes[theme] || fallbackThemes['IT'];
    }

    // Shuffle and return requested count
    const shuffled = [...words].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count).map(word => ({
      english: word.english,
      translations: { polish: word.polish }
    }));
  }

  /**
   * Maps language codes to full language names for StaticVocabularyService
   */
  private mapLanguageCodeToName(code: string): string {
    switch (code) {
      case 'pl': return 'polish';
      case 'es': return 'spanish';
      case 'de': return 'german';
      case 'fr': return 'french';
      default: return 'polish'; // fallback
    }
  }
}
