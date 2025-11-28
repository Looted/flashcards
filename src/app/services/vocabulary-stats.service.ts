import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface VocabularyStats {
  english: string;
  polish: string;
  category: string;
  timesEncountered: number;
  timesCorrect: number;
  timesIncorrect: number;
  lastEncountered: Date;
  masteryLevel: number; // 0-5 scale
  skipped?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class VocabularyStatsService {
  private readonly STORAGE_KEY = 'vocabulary-stats';
  private platformId = inject(PLATFORM_ID);

  private stats = new Map<string, VocabularyStats>();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.loadStats();
    }
  }

  /**
   * Get stats for a specific word
   */
  getStats(english: string, polish: string): VocabularyStats | null {
    const key = this.createKey(english, polish);
    return this.stats.get(key) || null;
  }

  /**
   * Record an encounter with a word
   */
  recordEncounter(english: string, polish: string, category: string, correct: boolean): void {
    const key = this.createKey(english, polish);
    const existing = this.stats.get(key);

    if (existing) {
      existing.timesEncountered++;
      if (correct) {
        existing.timesCorrect++;
      } else {
        existing.timesIncorrect++;
        // Reset timesCorrect to 0 when user gets it wrong in practice mode
        existing.timesCorrect = 0;
      }
      existing.lastEncountered = new Date();
      existing.masteryLevel = this.calculateMasteryLevel(existing);
    } else {
      this.stats.set(key, {
        english,
        polish,
        category,
        timesEncountered: 1,
        timesCorrect: correct ? 1 : 0,
        timesIncorrect: correct ? 0 : 1,
        lastEncountered: new Date(),
        masteryLevel: correct ? 1 : 0
      });
    }

    this.saveStats();
  }

  /**
   * Mark a word as skipped (will not appear in games)
   */
  markAsSkipped(english: string, polish: string, category: string): void {
    const key = this.createKey(english, polish);
    const existing = this.stats.get(key);

    if (existing) {
      existing.skipped = true;
      existing.lastEncountered = new Date();
    } else {
      this.stats.set(key, {
        english,
        polish,
        category,
        timesEncountered: 0,
        timesCorrect: 0,
        timesIncorrect: 0,
        lastEncountered: new Date(),
        masteryLevel: 0,
        skipped: true
      });
    }

    this.saveStats();
  }

  /**
   * Get all stats
   */
  getAllStats(): VocabularyStats[] {
    return Array.from(this.stats.values()).filter(s => !s.skipped);
  }

  /**
   * Get stats for a specific category
   */
  getStatsByCategory(category: string): VocabularyStats[] {
    return Array.from(this.stats.values()).filter(stat => stat.category === category && !stat.skipped);
  }

  /**
   * Get words that need practice (low mastery or recently wrong)
   */
  getWordsNeedingPractice(limit: number = 10): VocabularyStats[] {
    return Array.from(this.stats.values())
      .filter(stat => !stat.skipped && (stat.masteryLevel < 3 || stat.timesIncorrect > stat.timesCorrect))
      .sort((a, b) => {
        // Prioritize words with lower mastery levels
        if (a.masteryLevel !== b.masteryLevel) {
          return a.masteryLevel - b.masteryLevel;
        }
        // Then by error rate
        const aErrorRate = a.timesIncorrect / (a.timesEncountered || 1);
        const bErrorRate = b.timesIncorrect / (b.timesEncountered || 1);
        return bErrorRate - aErrorRate;
      })
      .slice(0, limit);
  }

  /**
   * Clear all stats
   */
  clearAllStats(): void {
    this.stats.clear();
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem(this.STORAGE_KEY);
    }
  }

  /**
   * Get mastery statistics
   */
  getMasteryStats() {
    const allStats = Array.from(this.stats.values()).filter(s => !s.skipped);
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
    const averageMastery = allStats.reduce((sum, s) => sum + s.masteryLevel, 0) / totalWords;

    return {
      totalWords,
      mastered,
      learning,
      needsPractice,
      averageMastery: Math.round(averageMastery * 100) / 100
    };
  }

  private createKey(english: string, polish: string): string {
    return `${english.toLowerCase().trim()}|${polish.toLowerCase().trim()}`;
  }

  private calculateMasteryLevel(stats: VocabularyStats): number {
    const totalAttempts = stats.timesEncountered;
    const correctRate = stats.timesCorrect / totalAttempts;

    // Simple mastery calculation
    if (totalAttempts < 3) {
      return correctRate >= 0.5 ? 1 : 0;
    } else if (totalAttempts < 5) {
      return correctRate >= 0.7 ? 2 : correctRate >= 0.5 ? 1 : 0;
    } else {
      if (correctRate >= 0.9) return 5;
      if (correctRate >= 0.8) return 4;
      if (correctRate >= 0.7) return 3;
      if (correctRate >= 0.6) return 2;
      return correctRate >= 0.4 ? 1 : 0;
    }
  }

  private loadStats(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const parsedStats = JSON.parse(stored);
        // Convert date strings back to Date objects
        Object.values(parsedStats).forEach((stat: any) => {
          stat.lastEncountered = new Date(stat.lastEncountered);
        });
        this.stats = new Map(Object.entries(parsedStats));
      }
    } catch (error) {
      console.warn('Failed to load vocabulary stats:', error);
      this.stats = new Map();
    }
  }

  private saveStats(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    try {
      const statsObject = Object.fromEntries(this.stats);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(statsObject));
    } catch (error) {
      console.warn('Failed to save vocabulary stats:', error);
    }
  }
}
