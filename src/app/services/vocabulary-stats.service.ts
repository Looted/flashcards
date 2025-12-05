import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';
import { FirestoreService } from './firestore.service';

export interface WordStats {
  english: string;
  polish: string;
  category: string;
  timesEncountered: number;
  timesCorrect: number;
  timesIncorrect: number;
  lastEncountered: number;
  masteryLevel: number; // 0-5 scale
  skipped?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VocabularyStatsService {
  private readonly STORAGE_KEY = 'vocabulary-stats';
  private readonly storageService = inject(StorageService);
  private readonly authService = inject(AuthService);
  private readonly firestoreService = inject(FirestoreService);

  private stats = signal<Map<string, WordStats>>(new Map());

  // Computed signals for reactive data
  totalWordsNeedingReview = computed(() => {
    const allStats = this.getAllStats();
    return allStats.filter(s => s.masteryLevel < 2).length;
  });

  wordsNeedingReviewByCategory = computed(() => {
    const categoryCounts: Record<string, number> = {};
    const allStats = this.getAllStats();

    for (const stat of allStats) {
      if (stat.masteryLevel < 2) {
        categoryCounts[stat.category] = (categoryCounts[stat.category] || 0) + 1;
      }
    }

    return categoryCounts;
  });

  constructor() {
    // Load initial data
    this.loadStats();

    // Listen to auth state changes to sync data
    effect(() => {
      const user = this.authService.currentUser();
      const profileReady = this.authService.userProfileReady();
      if (user && profileReady) {
        this.loadFromFirestore(user.uid);
      }
    });
  }

  private loadStats(): void {
    try {
      const savedStats = this.storageService.getItem(this.STORAGE_KEY);
      if (savedStats) {
        const parsed = JSON.parse(savedStats);
        this.stats.set(new Map(Object.entries(parsed)));
      }
    } catch (e) {
      console.warn('Failed to load vocabulary stats:', e);
    }
  }

  private saveStats(): void {
    try {
      const obj = Object.fromEntries(this.stats());
      this.storageService.setItem(this.STORAGE_KEY, JSON.stringify(obj));

      // Also save to Firestore if user is authenticated
      if (this.authService.isAuthenticated()) {
        const user = this.authService.currentUser();
        if (user) {
          this.firestoreService.saveUserProgress(user.uid, obj);
        }
      }
    } catch (e) {
      console.warn('Failed to save vocabulary stats:', e);
    }
  }

  private async loadFromFirestore(uid: string): Promise<void> {
    try {
      const userProgress = await this.firestoreService.getUserProgress(uid);
      if (userProgress?.stats) {
        // Load data from Firestore and update the signal
        this.stats.set(new Map(Object.entries(userProgress.stats)));
      }
    } catch (error) {
      console.warn('Failed to load vocabulary stats from Firestore:', error);
    }
  }

  recordEncounter(english: string, polish: string, category: string, isCorrect: boolean): void {
    const key = this.getKey(english, polish);
    this.stats.update(currentStats => {
      const stats = new Map(currentStats);
      let stat = stats.get(key);

      if (!stat) {
        stat = {
          english,
          polish,
          category,
          timesEncountered: 0,
          timesCorrect: 0,
          timesIncorrect: 0,
          lastEncountered: Date.now(),
          masteryLevel: 0
        };
      }

      stat.timesEncountered++;
      stat.lastEncountered = Date.now();

      if (isCorrect) {
        stat.timesCorrect++;
        // Increase mastery if correct
        if (stat.masteryLevel < 5) {
          stat.masteryLevel++;
        }
      } else {
        stat.timesIncorrect++;
        // Decrease mastery if incorrect
        if (stat.masteryLevel > 0) {
          stat.masteryLevel = Math.max(0, stat.masteryLevel - 2);
        }
      }

      stats.set(key, stat);
      return stats;
    });
    this.saveStats();
  }

  markAsSkipped(english: string, polish: string, category: string): void {
    const key = this.getKey(english, polish);
    this.stats.update(currentStats => {
      const stats = new Map(currentStats);
      let stat = stats.get(key);

      if (!stat) {
        stat = {
          english,
          polish,
          category,
          timesEncountered: 0,
          timesCorrect: 0,
          timesIncorrect: 0,
          lastEncountered: Date.now(),
          masteryLevel: 0
        };
      }

      stat.skipped = true;
      stats.set(key, stat);
      return stats;
    });
    this.saveStats();
  }

  getStats(english: string, polish: string): WordStats | undefined {
    return this.stats().get(this.getKey(english, polish));
  }

  getAllStats(): WordStats[] {
    return Array.from(this.stats().values()).filter((s: WordStats) => !s.skipped);
  }

  getStatsByCategory(category: string): WordStats[] {
    return this.getAllStats().filter(s => s.category === category);
  }

  getWordsNeedingPractice(limit: number = 10): WordStats[] {
    return this.getAllStats()
      .sort((a, b) => {
        // First sort by mastery level (ascending)
        if (a.masteryLevel !== b.masteryLevel) {
          return a.masteryLevel - b.masteryLevel;
        }
        // Then by error rate (descending)
        const aRate = a.timesIncorrect / (a.timesEncountered || 1);
        const bRate = b.timesIncorrect / (b.timesEncountered || 1);
        return bRate - aRate;
      })
      .slice(0, limit);
  }

  getMasteryStats(): { totalWords: number, mastered: number, learning: number, needsPractice: number, averageMastery: number } {
    const allStats = this.getAllStats();
    const totalWords = allStats.length;

    if (totalWords === 0) {
      return {
        totalWords: 0,
        mastered: 0,
        learning: 0,
        needsPractice: 0,
        averageMastery: 0
      };
    }

    const mastered = allStats.filter(s => s.masteryLevel >= 4).length;
    const learning = allStats.filter(s => s.masteryLevel >= 2 && s.masteryLevel < 4).length;
    const needsPractice = allStats.filter(s => s.masteryLevel < 2).length;

    const totalMastery = allStats.reduce((sum, s) => sum + s.masteryLevel, 0);
    const averageMastery = Number((totalMastery / totalWords).toFixed(2));

    return {
      totalWords,
      mastered,
      learning,
      needsPractice,
      averageMastery
    };
  }

  clearAllStats(): void {
    this.stats.set(new Map());
    this.storageService.removeItem(this.STORAGE_KEY);
  }

  private getKey(english: string, polish: string): string {
    return `${english.toLowerCase()}|${polish.toLowerCase()}`;
  }
}
