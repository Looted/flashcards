import { TestBed } from '@angular/core/testing';
import { GameStore, Flashcard } from './game-store';
import { VocabularyStatsService } from './services/vocabulary-stats.service';
import { StorageService } from './services/storage.service';
import { PLATFORM_ID } from '@angular/core';
import { STANDARD_GAME_MODE } from './core/config/game-modes';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('GameStore', () => {
  let store: GameStore;
  let storageServiceMock: any;
  let vocabularyStatsServiceMock: any;

  beforeEach(() => {
    storageServiceMock = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };

    vocabularyStatsServiceMock = {
      markAsSkipped: vi.fn(),
      recordEncounter: vi.fn(),
      getStats: vi.fn(),
      getAllStats: vi.fn(),
      getStatsByCategory: vi.fn(),
      getWordsNeedingPractice: vi.fn(),
      getMasteryStats: vi.fn(),
      clearAllStats: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        GameStore,
        { provide: VocabularyStatsService, useValue: vocabularyStatsServiceMock },
        { provide: StorageService, useValue: storageServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    store = TestBed.inject(GameStore);
  });

  const mockCards: Flashcard[] = [
    { id: '1', english: 'Hello', polish: 'Cześć', category: 'Basic', masteryLevel: 0 },
    { id: '2', english: 'Goodbye', polish: 'Do widzenia', category: 'Basic', masteryLevel: 0 },
    { id: '3', english: 'Thank you', polish: 'Dziękuję', category: 'Basic', masteryLevel: 0 }
  ];

  describe('Initial state', () => {
    it('should start with MENU phase', () => {
      expect(store.phase()).toBe('MENU');
    });

    it('should start with empty activeDeck', () => {
      expect(store.activeDeck()).toEqual([]);
    });

    it('should start with empty queue', () => {
      expect(store.queue()).toEqual([]);
    });

    it('should start with empty graduatePile', () => {
      expect(store.graduatePile()).toEqual([]);
    });

    it('should start with roundIndex 0', () => {
      expect(store.roundIndex()).toBe(0);
    });

    it('should return null current card when queue is empty', () => {
      expect(store.currentCard()).toBeNull();
    });

    it('should return 0 progress when activeDeck is empty', () => {
      expect(store.progress()).toBe(0);
    });
  });

  describe('startGame', () => {
    it('should initialize with mode and cards', () => {
      store.startGame(STANDARD_GAME_MODE, mockCards);

      expect(store.activeDeck()).toEqual(mockCards);
      expect(store.phase()).toBe('PLAYING');
      expect(store.roundIndex()).toBe(0);
      expect(store.queue()).toHaveLength(3);
      expect(store.queue()[0].flashcard).toEqual(mockCards[0]);
      expect(store.queue()[0].successCount).toBe(0);
      expect(store.graduatePile()).toEqual([]);
    });

    it('should set current card to first card in queue', () => {
      store.startGame(STANDARD_GAME_MODE, mockCards);
      expect(store.currentCard()).toEqual(mockCards[0]);
    });
  });

  describe('progress calculation', () => {
    it('should calculate progress as graduated / total', () => {
      store.startGame(STANDARD_GAME_MODE, mockCards);
      expect(store.progress()).toBe(0); // 0/3

      store.submitAnswer(true); // Graduate first card
      expect(store.progress()).toBeCloseTo(33.333333333333336); // 1/3

      store.submitAnswer(true); // Graduate second
      expect(store.progress()).toBeCloseTo(66.66666666666667); // 2/3

      store.submitAnswer(true); // Graduate third
      expect(store.progress()).toBe(100); // 3/3
    });
  });

  describe('submitAnswer', () => {
    beforeEach(() => {
      store.startGame(STANDARD_GAME_MODE, mockCards);
    });

    it('should graduate card on first success', () => {
      store.submitAnswer(true);

      expect(store.queue()).toHaveLength(2);
      expect(store.graduatePile()).toEqual([mockCards[0]]);
      expect(store.queue()[0].flashcard).toEqual(mockCards[1]);
    });

    it('should requeue card on failure at offset 3', () => {
      store.submitAnswer(false);

      expect(store.queue()).toHaveLength(3);
      expect(store.graduatePile()).toEqual([]);
      expect(store.queue()[2].flashcard).toEqual(mockCards[0]); // Requeued at position 3 (index 2)
    });

    it('should go to summary when all cards graduate', () => {
      // Graduate all cards in round 1
      store.submitAnswer(true);
      store.submitAnswer(true);
      store.submitAnswer(true);

      expect(store.phase()).toBe('SUMMARY'); // Advances through empty rounds to summary
      expect(store.graduatePile()).toHaveLength(3);
    });

    it('should keep failed cards in current round', () => {
      // Fail first card
      store.submitAnswer(false);
      // Graduate second and third
      store.submitAnswer(true);
      store.submitAnswer(true);

      expect(store.roundIndex()).toBe(0); // Still in round 1
      expect(store.queue()).toHaveLength(1); // The failed card requeued
      expect(store.queue()[0].flashcard).toEqual(mockCards[0]);
      expect(store.graduatePile()).toHaveLength(2); // Second and third graduated
    });
  });

  describe('skipCurrentCard', () => {
    beforeEach(() => {
      store.startGame(STANDARD_GAME_MODE, mockCards);
    });

    it('should mark current card as skipped in stats service', () => {
      const statsService = TestBed.inject(VocabularyStatsService);
      const markAsSkippedSpy = vi.spyOn(statsService, 'markAsSkipped');

      store.skipCurrentCard();

      expect(markAsSkippedSpy).toHaveBeenCalledWith('Hello', 'Cześć', 'Basic');
    });

    it('should remove current card from queue', () => {
      expect(store.queue()).toHaveLength(3);

      store.skipCurrentCard();

      expect(store.queue()).toHaveLength(2);
      expect(store.queue()[0].flashcard).toEqual(mockCards[1]);
    });

    it('should advance round when queue empties after skip', () => {
      // Skip all cards one by one
      store.skipCurrentCard();
      store.skipCurrentCard();
      store.skipCurrentCard();

      expect(store.roundIndex()).toBe(1);
      expect(store.queue()).toHaveLength(3); // All cards again, since no graduates
    });

    it('should not crash when no current card', () => {
      store.startGame(STANDARD_GAME_MODE, []);
      expect(() => store.skipCurrentCard()).not.toThrow();
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      store.startGame(STANDARD_GAME_MODE, mockCards);
      store.submitAnswer(true);

      store.reset();

      expect(store.phase()).toBe('MENU');
      expect(store.activeDeck()).toEqual([]);
      expect(store.queue()).toEqual([]);
      expect(store.graduatePile()).toEqual([]);
      expect(store.roundIndex()).toBe(0);
    });
  });
});
