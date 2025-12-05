import { VocabularyStatsService } from './vocabulary-stats.service';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';
import { FirestoreService } from './firestore.service';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

class MockStorageService {
  getItem = vi.fn().mockReturnValue(null);
  setItem = vi.fn();
  removeItem = vi.fn();
  clear = vi.fn();
}

class MockAuthService {
  currentUser = vi.fn().mockReturnValue(null);
  userProfileReady = vi.fn().mockReturnValue(true);
  isAuthenticated = vi.fn().mockReturnValue(false);
}

class MockFirestoreService {
  saveUserProgress = vi.fn();
}

describe('VocabularyStatsService', () => {
  let service: VocabularyStatsService;
  let storageService: StorageService;
  let authService: AuthService;
  let firestoreService: FirestoreService;

  beforeEach(() => {
    storageService = new MockStorageService() as any;
    authService = new MockAuthService() as any;
    firestoreService = new MockFirestoreService() as any;

    // Mock the inject function globally for this test
    const mockInject = vi.fn((token: any) => {
      if (token === StorageService) return storageService;
      if (token === AuthService) return authService;
      if (token === FirestoreService) return firestoreService;
      return undefined;
    });

    // Mock signal, computed, effect to return simple objects
    vi.doMock('@angular/core', () => ({
      inject: mockInject,
      signal: vi.fn((initial) => ({
        set: vi.fn(),
        update: vi.fn(),
        asReadonly: () => ({})
      })),
      computed: vi.fn((fn) => fn()),
      effect: vi.fn(() => {}),
    }));

    service = new VocabularyStatsService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('recordEncounter', () => {
    it('should record a new word encounter', () => {
      service.recordEncounter('hello', 'cześć', 'basic', true);

      const stats = service.getStats('hello', 'cześć');
      expect(stats).toBeTruthy();
      expect(stats!.english).toBe('hello');
      expect(stats!.polish).toBe('cześć');
      expect(stats!.category).toBe('basic');
      expect(stats!.timesEncountered).toBe(1);
      expect(stats!.timesCorrect).toBe(1);
      expect(stats!.timesIncorrect).toBe(0);
      expect(stats!.masteryLevel).toBe(1);
      expect(storageService.setItem).toHaveBeenCalled();
    });

    it('should record incorrect answer', () => {
      service.recordEncounter('world', 'świat', 'basic', false);

      const stats = service.getStats('world', 'świat');
      expect(stats!.timesEncountered).toBe(1);
      expect(stats!.timesCorrect).toBe(0);
      expect(stats!.timesIncorrect).toBe(1);
      expect(stats!.masteryLevel).toBe(0);
    });

    it('should update existing word stats', () => {
      service.recordEncounter('test', 'test', 'basic', true);
      service.recordEncounter('test', 'test', 'basic', false);
      service.recordEncounter('test', 'test', 'basic', true);

      const stats = service.getStats('test', 'test');
      expect(stats!.timesEncountered).toBe(3);
      expect(stats!.timesCorrect).toBe(2);
      expect(stats!.timesIncorrect).toBe(1);
    });
  });

  describe('getWordsNeedingPractice', () => {
    it('should return words with low mastery levels', () => {
      // Add a mastered word (many correct answers)
      for (let i = 0; i < 10; i++) {
        service.recordEncounter('mastered', 'opanowany', 'basic', true);
      }

      // Add a word that needs practice (few encounters, incorrect)
      service.recordEncounter('hard', 'trudny', 'basic', false);
      service.recordEncounter('hard', 'trudny', 'basic', false);

      const needsPractice = service.getWordsNeedingPractice(10);
      // Returns all words sorted, so we expect 2 words
      expect(needsPractice.length).toBe(2);
      expect(needsPractice[0].english).toBe('hard');
    });

    it('should limit results to specified number', () => {
      for (let i = 0; i < 5; i++) {
        service.recordEncounter(`word${i}`, `słowo${i}`, 'basic', false);
      }

      const needsPractice = service.getWordsNeedingPractice(3);
      expect(needsPractice.length).toBe(3);
    });
  });

  describe('getMasteryStats', () => {
    it('should return empty stats when no words', () => {
      const stats = service.getMasteryStats();
      expect(stats.totalWords).toBe(0);
      expect(stats.mastered).toBe(0);
      expect(stats.learning).toBe(0);
      expect(stats.needsPractice).toBe(0);
      expect(stats.averageMastery).toBe(0);
    });

    it('should calculate mastery statistics correctly', () => {
      // Add mastered word (high correct rate, many encounters)
      for (let i = 0; i < 10; i++) {
        service.recordEncounter('mastered', 'opanowany', 'basic', true);
      }

      // Add learning word (some correct answers, mastery 2-3)
      for (let i = 0; i < 2; i++) {
        service.recordEncounter('learning', 'uczący się', 'basic', true);
      }

      // Add word needing practice
      service.recordEncounter('practice', 'ćwiczenie', 'basic', false);
      service.recordEncounter('practice', 'ćwiczenie', 'basic', false);

      const stats = service.getMasteryStats();
      expect(stats.totalWords).toBe(3);
      expect(stats.mastered).toBeGreaterThan(0);
      expect(stats.learning).toBeGreaterThan(0);
      expect(stats.needsPractice).toBeGreaterThan(0);
      expect(stats.averageMastery).toBeGreaterThan(0);
    });
  });

  describe('clearAllStats', () => {
    it('should clear all stats', () => {
      service.recordEncounter('clear', 'wyczyść', 'basic', true);
      expect(service.getAllStats().length).toBe(1);

      service.clearAllStats();
      expect(service.getAllStats().length).toBe(0);
      expect(storageService.removeItem).toHaveBeenCalled();
    });
  });

  describe('getStatsByCategory', () => {
    it('should return stats for specific category', () => {
      service.recordEncounter('cat', 'kot', 'animals', true);
      service.recordEncounter('dog', 'pies', 'animals', true);
      service.recordEncounter('hello', 'cześć', 'basic', true);

      const animalStats = service.getStatsByCategory('animals');
      expect(animalStats.length).toBe(2);
      expect(animalStats.map(s => s.english)).toEqual(['cat', 'dog']);

      const basicStats = service.getStatsByCategory('basic');
      expect(basicStats.length).toBe(1);
      expect(basicStats[0].english).toBe('hello');
    });
  });

  describe('markAsSkipped', () => {
    it('should mark existing word as skipped', () => {
      service.recordEncounter('skip', 'pomiń', 'basic', true);
      service.markAsSkipped('skip', 'pomiń', 'basic');

      const stats = service.getStats('skip', 'pomiń');
      expect(stats!.skipped).toBe(true);
      expect(service.getAllStats().length).toBe(0); // skipped words not included
    });

    it('should mark new word as skipped', () => {
      service.markAsSkipped('newskip', 'nowy pomin', 'basic');

      const stats = service.getStats('newskip', 'nowy pomin');
      expect(stats!.skipped).toBe(true);
      expect(stats!.timesEncountered).toBe(0);
    });
  });

  describe('getWordsNeedingPractice - sorting logic', () => {
    it('should sort by mastery level first', () => {
      // Low mastery word (mastery level 0)
      service.recordEncounter('low', 'niski', 'basic', false);
      service.recordEncounter('low', 'niski', 'basic', false);

      // Medium mastery word (mastery level 1 - still needs practice)
      service.recordEncounter('medium', 'średni', 'basic', true);
      service.recordEncounter('medium', 'średni', 'basic', false); // More incorrect than correct

      const needsPractice = service.getWordsNeedingPractice(10);
      expect(needsPractice.length).toBeGreaterThan(1);
      // The low mastery word should appear before the medium mastery word
      const lowIndex = needsPractice.findIndex(w => w.english === 'low');
      const mediumIndex = needsPractice.findIndex(w => w.english === 'medium');
      expect(lowIndex).toBeLessThan(mediumIndex);
      expect(lowIndex).toBeGreaterThanOrEqual(0);
      expect(mediumIndex).toBeGreaterThanOrEqual(0);
    });

    it('should sort by error rate when mastery levels are equal', () => {
      // Both have mastery level 0, but different error rates
      service.recordEncounter('higherror', 'dużo błędów', 'basic', false);
      service.recordEncounter('higherror', 'dużo błędów', 'basic', false);
      service.recordEncounter('higherror', 'dużo błędów', 'basic', false);

      service.recordEncounter('lowerror', 'mało błędów', 'basic', false);
      service.recordEncounter('lowerror', 'mało błędów', 'basic', true);

      const needsPractice = service.getWordsNeedingPractice(10);
      expect(needsPractice.length).toBeGreaterThan(0);
      // Higher error rate word should appear first
      expect(needsPractice[0].english).toBe('higherror');
    });
  });

  describe('getMasteryStats - average calculation', () => {
    it('should calculate average mastery correctly', () => {
      // Add words with different mastery levels
      service.recordEncounter('level1', 'poziom1', 'basic', true);
      service.recordEncounter('level2', 'poziom2', 'basic', true);
      service.recordEncounter('level2', 'poziom2', 'basic', true);
      service.recordEncounter('level3', 'poziom3', 'basic', true);
      service.recordEncounter('level3', 'poziom3', 'basic', true);
      service.recordEncounter('level3', 'poziom3', 'basic', true);

      const stats = service.getMasteryStats();
      // Actual mastery levels: level1=1, level2=2, level3=3
      // Expected average: (1 + 2 + 3) / 3 = 2
      expect(stats.averageMastery).toBe(2);
    });

    it('should round average mastery to 2 decimal places', () => {
      service.recordEncounter('word1', 'słowo1', 'basic', true);
      service.recordEncounter('word2', 'słowo2', 'basic', true);
      service.recordEncounter('word2', 'słowo2', 'basic', true);

      const stats = service.getMasteryStats();
      // Mastery levels: word1=1, word2=2
      // Average should be 1.5
      expect(stats.averageMastery).toBe(1.5);
    });
  });

  describe('Reactive signals', () => {
    describe('totalWordsNeedingReview', () => {
      it('should return 0 when no words need review', () => {
        expect(service.totalWordsNeedingReview()).toBe(0);
      });

      it('should return count of words with mastery level < 2', () => {
        // Add word with mastery level 0 (needs review)
        service.recordEncounter('needsreview', 'potrzebuje', 'basic', false);
        service.recordEncounter('needsreview', 'potrzebuje', 'basic', false);

        // Add word with mastery level 2 (doesn't need review)
        service.recordEncounter('good', 'dobry', 'basic', true);
        service.recordEncounter('good', 'dobry', 'basic', true);

        expect(service.totalWordsNeedingReview()).toBe(1);
      });

      it('should update reactively when stats change', () => {
        expect(service.totalWordsNeedingReview()).toBe(0);

        // Add word needing review
        service.recordEncounter('test', 'test', 'basic', false);
        expect(service.totalWordsNeedingReview()).toBe(1);

        // Improve word to mastery level 2
        for (let i = 0; i < 3; i++) {
          service.recordEncounter('test', 'test', 'basic', true);
        }
        expect(service.totalWordsNeedingReview()).toBe(0);
      });
    });

    describe('wordsNeedingReviewByCategory', () => {
      it('should return empty object when no words need review', () => {
        expect(service.wordsNeedingReviewByCategory()).toEqual({});
      });

      it('should return correct counts by category', () => {
        // Add words needing review in different categories
        service.recordEncounter('hr1', 'hr1', 'hr', false);
        service.recordEncounter('hr2', 'hr2', 'hr', false);
        service.recordEncounter('pm1', 'pm1', 'pm', false);

        // Add word that doesn't need review
        service.recordEncounter('good', 'dobry', 'hr', true);
        service.recordEncounter('good', 'dobry', 'hr', true);

        const result = service.wordsNeedingReviewByCategory();
        expect(result).toEqual({ 'hr': 2, 'pm': 1 });
      });

      it('should update reactively when stats change', () => {
        expect(service.wordsNeedingReviewByCategory()).toEqual({});

        // Add word needing review
        service.recordEncounter('hr1', 'hr1', 'hr', false);
        expect(service.wordsNeedingReviewByCategory()).toEqual({ 'hr': 1 });

        // Improve word
        for (let i = 0; i < 3; i++) {
          service.recordEncounter('hr1', 'hr1', 'hr', true);
        }
        expect(service.wordsNeedingReviewByCategory()).toEqual({});
      });
    });
  });

  describe('StorageService integration', () => {
    it('should load stats from storage', () => {
      const mockStats = {
        'test|test': {
          english: 'test',
          polish: 'test',
          category: 'basic',
          timesEncountered: 1,
          timesCorrect: 1,
          timesIncorrect: 0,
          lastEncountered: Date.now(),
          masteryLevel: 1
        }
      };

      // Mock the implementation
      (storageService.getItem as any).mockReturnValue(JSON.stringify(mockStats));

      // Manually trigger loadStats since constructor already ran
      (service as any).loadStats();

      const stats = service.getStats('test', 'test');
      expect(stats).toBeTruthy();
      expect(stats!.english).toBe('test');
    });

    // it('should handle storage errors gracefully', () => {
    //   (storageService.setItem as any).mockImplementation(() => {
    //     throw new Error('Storage error');
    //   });

    //   // Should not throw
    //   expect(() => {
    //     service.recordEncounter('test', 'test', 'basic', true);
    //   }).not.toThrow();
    // });
  });
});
