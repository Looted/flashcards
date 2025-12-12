import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { VocabularyStatsService } from './vocabulary-stats.service';
import { StorageService } from './storage.service';
import { TranslatedItem } from './static-vocabulary.service';
import { map, switchMap, of, catchError, forkJoin } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class FreemiumService {
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);
  private readonly statsService = inject(VocabularyStatsService);
  private readonly storageService = inject(StorageService);

  // Free word IDs per category
  private readonly freeWordsByCategory = signal<Map<string, {id: string, term: string, difficulty: number}[]>>(new Map());
  private readonly isLoading = signal<boolean>(true);

  // Persistent storage tracking (kept for analytics)
  private readonly STORAGE_KEY = 'freemium_words_count';
  private readonly MAX_FREE_WORDS = 60; // 3 rounds * 20 words

  // Public signals
  readonly isLoadingFreemiumData = this.isLoading.asReadonly();

  constructor() {
    // Load free word IDs on initialization
    this.loadFreeWordIds();

    // Listen to auth state changes to refresh premium status
    effect(() => {
      const user = this.authService.currentUser();
      const profileReady = this.authService.userProfileReady();
      if (user && profileReady) {
        this.loadFreeWordIds(); // Refresh free word list when user is authenticated
      }
    });
  }

  private async loadFreeWordIds(): Promise<void> {
    this.isLoading.set(true);
    try {
      const topics = ['technology', 'finance', 'sales', 'hr', 'strategy'];
      const freeWordsByCategory = new Map<string, {id: string, term: string, difficulty: number}[]>();

      // Load all English base files to collect free word IDs per category
      const observables = topics.map(topic => {
        const filename = `${topic}_en.json`;
        const url = `/i18n/${filename}`;
        return this.http.get<TranslatedItem[]>(url).pipe(
          map(data => {
            const freeWords: {id: string, term: string, difficulty: number}[] = [];
            data.forEach(item => {
              if (item.isFree) {
                freeWords.push({
                  id: item.id,
                  term: item.term,
                  difficulty: item.metadata?.difficulty || 1 // Default to 1 if missing
                });
              }
            });
            freeWordsByCategory.set(topic, freeWords);
          }),
          catchError(error => {
            console.error(`[FreemiumService] Failed to load free words for ${topic}:`, error);
            return of(null);
          })
        );
      });

      // Execute all requests in parallel
      await forkJoin(observables).toPromise();
      this.freeWordsByCategory.set(freeWordsByCategory);
      console.log(`[FreemiumService] Loaded free word IDs by category`, freeWordsByCategory);
    } catch (error) {
      console.error('[FreemiumService] Failed to load free word IDs:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Get free words list for a specific category
  getFreeWordsListForCategory(category: string, difficulty?: number): {id: string, term: string, difficulty: number}[] {
    const words = this.freeWordsByCategory().get(category) || [];
    if (difficulty !== undefined) {
      return words.filter(w => w.difficulty === difficulty);
    }
    return words;
  }

  // Get free word IDs for a specific category (compatibility method)
  getFreeWordsForCategory(category: string): Set<string> {
    const words = this.getFreeWordsListForCategory(category);
    return new Set(words.map(w => w.term.toLowerCase()));
  }

  // Get the number of free words already encountered for a category
  getEncounteredFreeWordCountForCategory(category: string, difficulty?: number): number {
    const freeWords = this.getFreeWordsListForCategory(category, difficulty);
    const freeTerms = new Set(freeWords.map(w => w.term.toLowerCase()));

    const allStats = this.statsService.getAllStats();
    const encountered = new Set<string>();

    allStats.forEach(stat => {
      if (stat.category === category && freeTerms.has(stat.english.toLowerCase())) {
        encountered.add(stat.english.toLowerCase());
      }
    });

    return encountered.size;
  }

  // Get remaining free words for a category
  getRemainingFreeWordsForCategory(category: string, difficulty?: number): number {
    const totalFreeWords = this.getFreeWordsListForCategory(category, difficulty).length;
    const encountered = this.getEncounteredFreeWordCountForCategory(category, difficulty);
    return Math.max(0, totalFreeWords - encountered);
  }

  // Check if a specific category is exhausted
  async isCategoryExhausted(category: string, difficulty?: number): Promise<boolean> {
    const isPremium = await this.authService.isPremiumUser();
    return !isPremium && this.getRemainingFreeWordsForCategory(category, difficulty) === 0;
  }

  // Check if a specific word is free (for a given category)
  isFreeWord(word: string, category: string): boolean {
    const words = this.getFreeWordsListForCategory(category);
    return words.some(w => w.term.toLowerCase() === word.toLowerCase());
  }

  // Get the total number of free words available for a category
  getTotalFreeWordsForCategory(category: string, difficulty?: number): number {
    return this.getFreeWordsListForCategory(category, difficulty).length;
  }

  // Persistent tracking methods for analytics (kept for historical tracking)
  private getWordsPlayedCount(): number {
    const count = this.storageService.getItem(this.STORAGE_KEY);
    return count ? parseInt(count, 10) : 0;
  }

  private incrementWordsPlayed(count: number): void {
    const current = this.getWordsPlayedCount();
    this.storageService.setItem(this.STORAGE_KEY, (current + count).toString());
  }

  // Analytics tracking - records word usage for free users
  recordSessionWords(category: string, wordCount: number): void {
    this.incrementWordsPlayed(wordCount);
  }

  // Check if user can start a new game (considering both exhaustion and session limits)
  async canStartNewGame(category: string, gameModeType: 'classic' | 'blitz'): Promise<boolean> {
    const isPremium = await this.authService.isPremiumUser();
    if (isPremium) return true;

    // Check if category is completely exhausted
    if (await this.isCategoryExhausted(category)) {
      return false;
    }

    return true;
  }
}
