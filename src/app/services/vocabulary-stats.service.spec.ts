import { TestBed } from '@angular/core/testing';
import { VocabularyStatsService } from './vocabulary-stats.service';
import { StorageService } from './storage.service';
import { AuthService } from './auth.service';
import { FirestoreService } from './firestore.service';
import { vi } from 'vitest';

describe('VocabularyStatsService', () => {
  let service: VocabularyStatsService;
  let storageService: any;
  let authService: any;
  let firestoreService: any;

  beforeEach(() => {
    const storageSpy = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };
    const authSpy = {
      currentUser: vi.fn().mockReturnValue(null),
      userProfileReady: vi.fn().mockReturnValue(true),
      isAuthenticated: vi.fn().mockReturnValue(false)
    };
    const firestoreSpy = {
      saveUserProgress: vi.fn(),
      getUserProgress: vi.fn().mockResolvedValue(null)
    };

    TestBed.configureTestingModule({
      providers: [
        VocabularyStatsService,
        { provide: StorageService, useValue: storageSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: FirestoreService, useValue: firestoreSpy }
      ]
    });

    service = TestBed.inject(VocabularyStatsService);
    storageService = TestBed.inject(StorageService);
    authService = TestBed.inject(AuthService);
    firestoreService = TestBed.inject(FirestoreService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('recordEncounter', () => {
    it('should record a new word encounter', () => {
      service.recordEncounter('hello', 'basic', true);

      const stats = service.getStats('hello');
      expect(stats).toBeTruthy();
      expect(stats!.english).toBe('hello');
      expect(stats!.category).toBe('basic');
      expect(stats!.timesEncountered).toBe(1);
      expect(stats!.timesCorrect).toBe(1);
      expect(stats!.timesIncorrect).toBe(0);
      expect(stats!.masteryLevel).toBe(1);
      expect(storageService.setItem).toHaveBeenCalled();
    });

    it('should record incorrect answer', () => {
      service.recordEncounter('world', 'basic', false);

      const stats = service.getStats('world');
      expect(stats!.timesEncountered).toBe(1);
      expect(stats!.timesCorrect).toBe(0);
      expect(stats!.timesIncorrect).toBe(1);
      expect(stats!.masteryLevel).toBe(0);
    });

    it('should update existing word stats', () => {
      service.recordEncounter('test', 'basic', true);
      service.recordEncounter('test', 'basic', false);
      service.recordEncounter('test', 'basic', true);

      const stats = service.getStats('test');
      expect(stats!.timesEncountered).toBe(3);
      expect(stats!.timesCorrect).toBe(2);
      expect(stats!.timesIncorrect).toBe(1);
    });
  });

  describe('getWordsNeedingPractice', () => {
    it('should return words with low mastery levels', () => {
      // Add a mastered word (many correct answers)
      for (let i = 0; i < 10; i++) {
        service.recordEncounter('mastered', 'basic', true);
      }

      // Add a word that needs practice (few encounters, incorrect)
      service.recordEncounter('hard', 'basic', false);
      service.recordEncounter('hard', 'basic', false);

      const needsPractice = service.getWordsNeedingPractice(10);
      // Returns all words sorted, so we expect 2 words
      expect(needsPractice.length).toBe(2);
      expect(needsPractice[0].english).toBe('hard');
    });

    it('should limit results to specified number', () => {
      for (let i = 0; i < 5; i++) {
        service.recordEncounter(`word${i}`, 'basic', false);
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
        service.recordEncounter('mastered', 'basic', true);
      }

      // Add learning word (some correct answers, mastery 2-3)
      for (let i = 0; i < 2; i++) {
        service.recordEncounter('learning', 'basic', true);
      }

      // Add word needing practice
      service.recordEncounter('practice', 'basic', false);
      service.recordEncounter('practice', 'basic', false);

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
      service.recordEncounter('clear', 'basic', true);
      expect(service.getAllStats().length).toBe(1);

      service.clearAllStats();
      expect(service.getAllStats().length).toBe(0);
      expect(storageService.removeItem).toHaveBeenCalled();
    });
  });

  describe('getStatsByCategory', () => {
    it('should return stats for specific category', () => {
      service.recordEncounter('cat', 'animals', true);
      service.recordEncounter('dog', 'animals', true);
      service.recordEncounter('hello', 'basic', true);

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
      service.recordEncounter('skip', 'basic', true);
      service.markAsSkipped('skip', 'basic');

      const stats = service.getStats('skip');
      expect(stats!.skipped).toBe(true);
      expect(service.getAllStats().length).toBe(0); // skipped words not included
    });

    it('should mark new word as skipped', () => {
      service.markAsSkipped('newskip', 'basic');

      const stats = service.getStats('newskip');
      expect(stats!.skipped).toBe(true);
      expect(stats!.timesEncountered).toBe(0);
    });
  });

  describe('getWordsNeedingPractice - sorting logic', () => {
    it('should sort by mastery level first', () => {
      // Low mastery word (mastery level 0)
      service.recordEncounter('low', 'basic', false);
      service.recordEncounter('low', 'basic', false);

      // Medium mastery word (mastery level 1 - still needs practice)
      service.recordEncounter('medium', 'basic', true);
      service.recordEncounter('medium', 'basic', false); // More incorrect than correct

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
      service.recordEncounter('higherror', 'basic', false);
      service.recordEncounter('higherror', 'basic', false);
      service.recordEncounter('higherror', 'basic', false);

      service.recordEncounter('lowerror', 'basic', false);
      service.recordEncounter('lowerror', 'basic', true);

      const needsPractice = service.getWordsNeedingPractice(10);
      expect(needsPractice.length).toBeGreaterThan(0);
      // Higher error rate word should appear first
      expect(needsPractice[0].english).toBe('higherror');
    });
  });

  describe('getMasteryStats - average calculation', () => {
    it('should calculate average mastery correctly', () => {
      // Add words with different mastery levels
      service.recordEncounter('level1', 'basic', true);
      service.recordEncounter('level2', 'basic', true);
      service.recordEncounter('level2', 'basic', true);
      service.recordEncounter('level3', 'basic', true);
      service.recordEncounter('level3', 'basic', true);
      service.recordEncounter('level3', 'basic', true);

      const stats = service.getMasteryStats();
      // Actual mastery levels: level1=1, level2=2, level3=3
      // Expected average: (1 + 2 + 3) / 3 = 2
      expect(stats.averageMastery).toBe(2);
    });

    it('should round average mastery to 2 decimal places', () => {
      service.recordEncounter('word1', 'basic', true);
      service.recordEncounter('word2', 'basic', true);
      service.recordEncounter('word2', 'basic', true);

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
        service.recordEncounter('needsreview', 'basic', false);
        service.recordEncounter('needsreview', 'basic', false);

        // Add word with mastery level 2 (doesn't need review)
        service.recordEncounter('good', 'basic', true);
        service.recordEncounter('good', 'basic', true);

        expect(service.totalWordsNeedingReview()).toBe(1);
      });

      it('should update reactively when stats change', () => {
        expect(service.totalWordsNeedingReview()).toBe(0);

        // Add word needing review
        service.recordEncounter('test', 'basic', false);
        expect(service.totalWordsNeedingReview()).toBe(1);

        // Improve word to mastery level 2
        for (let i = 0; i < 3; i++) {
          service.recordEncounter('test', 'basic', true);
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
        service.recordEncounter('hr1', 'hr', false);
        service.recordEncounter('hr2', 'hr', false);
        service.recordEncounter('pm1', 'pm', false);

        // Add word that doesn't need review
        service.recordEncounter('good', 'hr', true);
        service.recordEncounter('good', 'hr', true);

        const result = service.wordsNeedingReviewByCategory();
        expect(result).toEqual({ 'hr': 2, 'pm': 1 });
      });

      it('should update reactively when stats change', () => {
        expect(service.wordsNeedingReviewByCategory()).toEqual({});

        // Add word needing review
        service.recordEncounter('hr1', 'hr', false);
        expect(service.wordsNeedingReviewByCategory()).toEqual({ 'hr': 1 });

        // Improve word
        for (let i = 0; i < 3; i++) {
          service.recordEncounter('hr1', 'hr', true);
        }
        expect(service.wordsNeedingReviewByCategory()).toEqual({});
      });
    });
  });

  describe('StorageService integration', () => {
    it('should load stats from storage', () => {
      const mockStats = {
        'test': {
          english: 'test',
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

      const stats = service.getStats('test');
      expect(stats).toBeTruthy();
      expect(stats!.english).toBe('test');
    });

    // it('should handle storage errors gracefully', () => {
    //   (storageService.setItem as any).mockImplementation(() => {
    //     throw new Error('Storage error');
    //   });

    //   // Should not throw
    //   expect(() => {
    //     service.recordEncounter('test', 'basic', true);
    //   }).not.toThrow();
    // });
  });
});
