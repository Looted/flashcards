import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { GameService } from './game.service';
import { AiWordGenerationService } from './ai-word-generation';
import { StaticVocabularyService } from './static-vocabulary.service';
import { VocabularyStatsService } from './vocabulary-stats.service';
import { GameStore } from '../game-store';
import { GameMode, GAME_CONSTANTS } from '../shared/constants';
import { GameModeService } from './game-mode.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('GameService', () => {
  let service: GameService;
  let mockAiService: any;
  let mockStaticService: any;
  let mockStatsService: any;
  let mockStore: any;

  beforeEach(() => {
    mockAiService = {
      generateWords: vi.fn()
    };

    mockStaticService = {
      generateWords: vi.fn()
    };

    mockStatsService = {
      getStats: vi.fn(),
      getWordsNeedingPractice: vi.fn()
    };

    mockStore = {
      startGame: vi.fn(),
      submitAnswer: vi.fn(),
      skipCurrentCard: vi.fn()
    };

    const mockGameModeService = {
      getStandardGameMode: vi.fn().mockReturnValue({
        id: 'standard',
        description: 'Standard Learning Mode',
        rounds: []
      })
    };

    TestBed.configureTestingModule({
      providers: [
        GameService,
        { provide: GameModeService, useValue: mockGameModeService },
        { provide: AiWordGenerationService, useValue: mockAiService },
        { provide: StaticVocabularyService, useValue: mockStaticService },
        { provide: VocabularyStatsService, useValue: mockStatsService },
        { provide: GameStore, useValue: mockStore }
      ]
    });

    service = TestBed.inject(GameService);
  });

  describe('startGame', () => {
    const mockCards = [
      { english: 'hello', translations: { polish: 'cześć' } },
      { english: 'world', translations: { polish: 'świat' } }
    ];

    beforeEach(() => {
      mockAiService.generateWords.mockResolvedValue(mockCards);
      mockStaticService.generateWords.mockReturnValue(of(mockCards));
      mockStatsService.getStats.mockReturnValue(null);
      mockStatsService.getWordsNeedingPractice.mockReturnValue([]);
    });

    it('should use static vocabulary for HR topic when useStatic is true', async () => {
      await service.startGame('HR', GameMode.New, true, null);

      expect(mockStaticService.generateWords).toHaveBeenCalledWith('HR', GAME_CONSTANTS.CARDS_PER_GAME, undefined);
      expect(mockAiService.generateWords).not.toHaveBeenCalled();
    });

    it('should use AI service for non-HR topics even when useStatic is true', async () => {
      await service.startGame('IT', GameMode.New, true, null);

      expect(mockAiService.generateWords).toHaveBeenCalledWith('IT', GAME_CONSTANTS.CARDS_PER_GAME, undefined, null);
      expect(mockStaticService.generateWords).not.toHaveBeenCalled();
    });

    it('should use AI service when useStatic is false', async () => {
      await service.startGame('IT', GameMode.New, false, null);

      expect(mockAiService.generateWords).toHaveBeenCalledWith('IT', GAME_CONSTANTS.CARDS_PER_GAME, undefined, null);
      expect(mockStaticService.generateWords).not.toHaveBeenCalled();
    });

    it('should pass difficulty parameter to AI service', async () => {
      await service.startGame('IT', GameMode.New, false, 2);

      expect(mockAiService.generateWords).toHaveBeenCalledWith('IT', GAME_CONSTANTS.CARDS_PER_GAME, undefined, 2);
    });

    it('should pass difficulty parameter to static service', async () => {
      await service.startGame('HR', GameMode.New, true, 3);

      expect(mockStaticService.generateWords).toHaveBeenCalledWith('HR', GAME_CONSTANTS.CARDS_PER_GAME, 3);
    });

    it('should filter cards for New mode to show only unseen words', async () => {
      const cardsWithStats = [
        { english: 'seen', translations: { polish: 'widziany' } },
        { english: 'unseen', translations: { polish: 'niewidziany' } }
      ];
      mockAiService.generateWords.mockResolvedValue(cardsWithStats);

      mockStatsService.getStats
        .mockReturnValueOnce({}) // seen word has stats
        .mockReturnValueOnce(null); // unseen word has no stats

      await service.startGame('IT', GameMode.New, false, null);

      const gameModeService = TestBed.inject(GameModeService);
      expect(mockStore.startGame).toHaveBeenCalledWith(gameModeService.getStandardGameMode(), [
        {
          id: expect.any(String),
          english: 'unseen',
          translations: { polish: 'niewidziany' },
          category: 'IT',
          masteryLevel: 0
        }
      ]);
    });

    it('should filter cards for Practice mode to show words needing practice', async () => {
      const practiceWords = [
        { english: 'practice1', polish: 'ćwiczenie1', category: 'IT', score: 3 },
        { english: 'practice2', polish: 'ćwiczenie2', category: 'IT', score: 2 },
        { english: 'practice3', polish: 'ćwiczenie3', category: 'Other', score: 1 }
      ];

      mockStatsService.getWordsNeedingPractice.mockReturnValue(practiceWords);

      await service.startGame('IT', GameMode.Practice, false, null);

      const gameModeService = TestBed.inject(GameModeService);
      expect(mockStore.startGame).toHaveBeenCalledWith(gameModeService.getStandardGameMode(), [
        {
          id: expect.any(String),
          english: 'practice1',
          translations: { polish: 'ćwiczenie1' },
          category: 'IT',
          masteryLevel: 0
        },
        {
          id: expect.any(String),
          english: 'practice2',
          translations: { polish: 'ćwiczenie2' },
          category: 'IT',
          masteryLevel: 0
        }
      ]);
    });

    it('should limit practice words to CARDS_PER_GAME', async () => {
      const manyPracticeWords = Array.from({ length: 20 }, (_, i) => ({
        english: `practice${i}`,
        polish: `ćwiczenie${i}`,
        category: 'IT',
        score: i
      }));

      mockStatsService.getWordsNeedingPractice.mockReturnValue(manyPracticeWords);

      await service.startGame('IT', GameMode.Practice, false, null);

      const callArgs = mockStore.startGame.mock.calls[0][1]; // cards are at index 1
      expect(callArgs).toHaveLength(GAME_CONSTANTS.CARDS_PER_GAME);
    });

    it('should create flashcards with proper structure', async () => {
      await service.startGame('IT', GameMode.New, false, null);

      const gameModeService = TestBed.inject(GameModeService);
      expect(mockStore.startGame).toHaveBeenCalledWith(gameModeService.getStandardGameMode(), [
        {
          id: expect.any(String),
          english: 'hello',
          translations: { polish: 'cześć' },
          category: 'IT',
          masteryLevel: 0
        },
        {
          id: expect.any(String),
          english: 'world',
          translations: { polish: 'świat' },
          category: 'IT',
          masteryLevel: 0
        }
      ]);
    });

    it('should handle empty cards array', async () => {
      mockAiService.generateWords.mockResolvedValue([]);

      await service.startGame('IT', GameMode.New, false, null);

      const gameModeService = TestBed.inject(GameModeService);
      expect(mockStore.startGame).toHaveBeenCalledWith(gameModeService.getStandardGameMode(), []);
    });

    it('should handle static service returning empty observable', async () => {
      mockStaticService.generateWords.mockReturnValue(of([]));

      await service.startGame('HR', GameMode.New, true, null);

      const gameModeService = TestBed.inject(GameModeService);
      expect(mockStore.startGame).toHaveBeenCalledWith(gameModeService.getStandardGameMode(), []);
    });
  });

  describe('handleAnswer', () => {
    it('should delegate to store', () => {
      service.handleAnswer(true);
      expect(mockStore.submitAnswer).toHaveBeenCalledWith(true);

      service.handleAnswer(false);
      expect(mockStore.submitAnswer).toHaveBeenCalledWith(false);
    });
  });

  describe('skipCard', () => {
    it('should delegate to store', () => {
      service.skipCard();
      expect(mockStore.skipCurrentCard).toHaveBeenCalled();
    });
  });
});
