import { TestBed } from '@angular/core/testing';
import { GameStore, Flashcard } from './game-store';
import { VocabularyStatsService } from './services/vocabulary-stats.service';
import { StorageService } from './services/storage.service';
import { PLATFORM_ID } from '@angular/core';
import { GameModeService } from './services/game-mode.service';
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
        {
          provide: GameModeService,
          useValue: {
            getStandardGameMode: () => mockGameMode
          }
        },
        { provide: VocabularyStatsService, useValue: vocabularyStatsServiceMock },
        { provide: StorageService, useValue: storageServiceMock },
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    store = TestBed.inject(GameStore);
  });

  const mockCards: Flashcard[] = [
    { id: '1', english: 'Hello', translations: { polish: 'Cześć' }, category: 'Basic', masteryLevel: 0 },
    { id: '2', english: 'Goodbye', translations: { polish: 'Do widzenia' }, category: 'Basic', masteryLevel: 0 },
    { id: '3', english: 'Thank you', translations: { polish: 'Dziękuję' }, category: 'Basic', masteryLevel: 0 }
  ];

  // Mock game mode for tests
  const mockGameMode = {
    id: 'standard',
    description: 'Standard Learning Mode',
    rounds: [
      {
        id: 'recognition',
        name: 'Recognition',
        layout: {
          templateId: 'flashcard_standard' as any,
          dataMap: {
            primary: 'english' as any,
            secondary: 'polish' as any
          }
        },
        inputSource: 'deck_start' as any,
        completionCriteria: { requiredSuccesses: 1 },
        failureBehavior: { action: 'requeue' as any, strategy: 'static_offset' as any, params: [3] }
      },
      {
        id: 'recall',
        name: 'Recall',
        layout: {
          templateId: 'flashcard_standard' as any,
          dataMap: {
            primary: 'polish' as any,
            secondary: 'english' as any
          }
        },
        inputSource: 'deck_start' as any,
        completionCriteria: { requiredSuccesses: 1 },
        failureBehavior: { action: 'requeue' as any, strategy: 'static_offset' as any, params: [3] }
      },
      {
        id: 'writing',
        name: 'Writing',
        layout: {
          templateId: 'typing_challenge' as any,
          dataMap: {
            primary: 'polish' as any,
            secondary: 'english' as any
          }
        },
        inputSource: 'deck_start' as any,
        completionCriteria: { requiredSuccesses: 1 },
        failureBehavior: { action: 'requeue' as any, strategy: 'static_offset' as any, params: [3] }
      }
    ]
  } as any;

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
      store.startGame(mockGameMode, mockCards);

      expect(store.activeDeck()).toEqual(mockCards);
      expect(store.phase()).toBe('PLAYING');
      expect(store.roundIndex()).toBe(0);
      expect(store.queue()).toHaveLength(3);
      expect(store.queue()[0].flashcard).toEqual(mockCards[0]);
      expect(store.queue()[0].successCount).toBe(0);
      expect(store.graduatePile()).toEqual([]);
    });

    it('should set current card to first card in queue', () => {
      store.startGame(mockGameMode, mockCards);
      expect(store.currentCard()).toEqual(mockCards[0]);
    });
  });

  describe('progress calculation', () => {
    it('should calculate progress as graduated / total', () => {
      store.startGame(mockGameMode, mockCards);
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
      store.startGame(mockGameMode, mockCards);
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

    it('should advance to next round when all cards graduate in current round', () => {
      // Graduate all cards in round 1
      store.submitAnswer(true);
      store.submitAnswer(true);
      store.submitAnswer(true);

      expect(store.phase()).toBe('PLAYING'); // Advances to round 2 with full deck
      expect(store.roundIndex()).toBe(1); // Now in round 2 (recall)
      expect(store.graduatePile()).toHaveLength(3);
      expect(store.queue()).toHaveLength(3); // Round 2 starts with full deck
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
      store.startGame(mockGameMode, mockCards);
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
      store.startGame(mockGameMode, []);
      expect(() => store.skipCurrentCard()).not.toThrow();
    });
  });

  describe('advanceRound with different input sources', () => {
    it('should use prev_round_successes for next round', () => {
      const modeWithSuccessesInput = {
        ...mockGameMode,
        rounds: [
          mockGameMode.rounds[0], // round 1: deck_start
          {
            ...mockGameMode.rounds[1],
            inputSource: 'prev_round_successes' as any
          }
        ]
      };

      store.startGame(modeWithSuccessesInput, mockCards);

      // Graduate all cards in round 1
      store.submitAnswer(true);
      store.submitAnswer(true);
      store.submitAnswer(true);

      // Should advance to round 2 using only graduated cards
      expect(store.roundIndex()).toBe(1);
      expect(store.queue()).toHaveLength(3); // All graduated cards from round 1
      expect(store.graduatePile()).toHaveLength(3);
    });

    it('should use prev_round_failures for next round', () => {
      const modeWithFailuresInput = {
        ...mockGameMode,
        rounds: [
          mockGameMode.rounds[0], // round 1: deck_start
          {
            ...mockGameMode.rounds[1],
            inputSource: 'prev_round_failures' as any
          }
        ]
      };

      store.startGame(modeWithFailuresInput, mockCards);

      // Fail first card, succeed others
      store.submitAnswer(false);
      store.submitAnswer(true);
      store.submitAnswer(true);

      // Graduate pile has 2, queue has 1 (failed)
      expect(store.graduatePile()).toHaveLength(2);
      expect(store.queue()).toHaveLength(1);

      // Advance round - graduate the failed card, then advance to round 2
      store.submitAnswer(true); // Graduate the failed card

      expect(store.roundIndex()).toBe(1);
      expect(store.queue()).toHaveLength(0); // No failures left
      expect(store.phase()).toBe('SUMMARY'); // No more rounds
      expect(store.graduatePile()).toHaveLength(3);
    });

    it('should skip rounds with empty queue', () => {
      const modeWithEmptyRound = {
        ...mockGameMode,
        rounds: [
          mockGameMode.rounds[0], // round 1: deck_start
          {
            ...mockGameMode.rounds[1],
            inputSource: 'prev_round_failures' as any // Will be empty since all succeed
          },
          mockGameMode.rounds[2] // round 3: deck_start
        ]
      };

      store.startGame(modeWithEmptyRound, mockCards);

      // Succeed all in round 1
      store.submitAnswer(true);
      store.submitAnswer(true);
      store.submitAnswer(true);

      // Should skip round 2 (empty) and go to round 3
      expect(store.roundIndex()).toBe(2);
      expect(store.queue()).toHaveLength(3);
      expect(store.phase()).toBe('PLAYING');
    });

    it('should handle unknown inputSource gracefully', () => {
      const modeWithUnknownInput = {
        ...mockGameMode,
        rounds: [
          mockGameMode.rounds[0], // round 1: deck_start
          {
            ...mockGameMode.rounds[1],
            inputSource: 'unknown' as any
          }
        ]
      };

      store.startGame(modeWithUnknownInput, mockCards);

      // Graduate all cards in round 1
      store.submitAnswer(true);
      store.submitAnswer(true);
      store.submitAnswer(true);

      // Should advance to round 2 with empty queue, then skip to summary
      expect(store.phase()).toBe('SUMMARY');
    });
  });

  describe('reset', () => {
    it('should reset all state to initial values', () => {
      store.startGame(mockGameMode, mockCards);
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
