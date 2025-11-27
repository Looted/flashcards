import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';

import { VocabularyStatsService } from './vocabulary-stats.service';

describe('VocabularyStatsService', () => {
  let service: VocabularyStatsService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        VocabularyStatsService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(VocabularyStatsService);
    // Clear any existing stats from localStorage
    service.clearAllStats();
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
      expect(stats!.masteryLevel).toBeGreaterThan(0);
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
      expect(needsPractice.length).toBe(1);
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

      // Add learning word
      for (let i = 0; i < 5; i++) {
        service.recordEncounter('learning', 'uczący się', 'basic', i < 3 ? true : false);
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
    });
  });
});
