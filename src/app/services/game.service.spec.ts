import { TestBed } from '@angular/core/testing';
import { GameService } from './game.service';
import { GameStore } from '../game-store';
import { StaticVocabularyService } from './static-vocabulary.service';
import { AiWordGenerationService } from './ai-word-generation';
import { VocabularyStatsService } from './vocabulary-stats.service';
import { GameModeService } from './game-mode.service';
import { LanguageService } from './language.service';
import { GameMode } from '../shared/constants';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('GameService', () => {
  let service: GameService;
  let gameStoreMock: any;
  let staticVocabMock: any;
  let languageServiceMock: any;

  beforeEach(() => {
    gameStoreMock = {
      startGame: vi.fn()
    };

    staticVocabMock = {
      generateTranslatedWords: vi.fn().mockReturnValue(of([
        {
          english: 'test',
          translations: {
            polish: 'testowy',
            definition_polish: 'to jest definicja testowa',
            definition_english: 'this is a test definition'
          }
        }
      ]))
    };

    languageServiceMock = {
      currentLanguage: vi.fn().mockReturnValue('pl')
    };

    const gameModeServiceMock = {
      getGameMode: vi.fn().mockReturnValue({
        id: 'test',
        rounds: []
      })
    };

    TestBed.configureTestingModule({
      providers: [
        GameService,
        { provide: GameStore, useValue: gameStoreMock },
        { provide: StaticVocabularyService, useValue: staticVocabMock },
        { provide: AiWordGenerationService, useValue: {} },
        { provide: VocabularyStatsService, useValue: {} },
        { provide: GameModeService, useValue: gameModeServiceMock },
        { provide: LanguageService, useValue: languageServiceMock }
      ]
    });

    service = TestBed.inject(GameService);
  });

  describe('definition extraction', () => {
    it('should always use English definition from base file', async () => {
      // Mock the static vocabulary to return a card with both English and Polish definitions
      const mockCards = [
        {
          english: 'test',
          translations: {
            polish: 'testowy',
            definition_polish: 'to jest definicja testowa',
            definition_english: 'this is a test definition'
          }
        }
      ];

      // Mock the static vocabulary service
      vi.spyOn(staticVocabMock, 'generateTranslatedWords').mockReturnValue(of(mockCards));

      // Call startGame with static mode
      await service.startGame('hr', GameMode.New, 'classic', true, null);

      // Verify that startGame was called with flashcards containing definitions
      expect(gameStoreMock.startGame).toHaveBeenCalled();

      const callArgs = gameStoreMock.startGame.mock.calls[0];
      const flashcards = callArgs[1];

      // Check that the flashcard has the English definition (never the translated one)
      expect(flashcards[0].definition).toBe('this is a test definition');
      expect(flashcards[0].english).toBe('test');
      expect(flashcards[0].translations.polish).toBe('testowy');
    });

    it('should fallback to English definition when language-specific not available', async () => {
      // Mock the static vocabulary to return a card without polish definition
      const mockCards = [
        {
          english: 'test',
          translations: {
            polish: 'testowy',
            definition_english: 'this is a test definition'
          }
        }
      ];

      // Mock the static vocabulary service
      vi.spyOn(staticVocabMock, 'generateTranslatedWords').mockReturnValue(of(mockCards));

      // Call startGame with static mode
      await service.startGame('hr', GameMode.New, 'classic', true, null);

      // Verify that startGame was called with flashcards containing definitions
      expect(gameStoreMock.startGame).toHaveBeenCalled();

      const callArgs = gameStoreMock.startGame.mock.calls[0];
      const flashcards = callArgs[1];

      // Check that the flashcard has the English definition as fallback
      expect(flashcards[0].definition).toBe('this is a test definition');
    });

    it('should handle cards without definitions gracefully', async () => {
      // Mock the static vocabulary to return a card without any definition
      const mockCards = [
        {
          english: 'test',
          translations: {
            polish: 'testowy'
          }
        }
      ];

      // Mock the static vocabulary service
      vi.spyOn(staticVocabMock, 'generateTranslatedWords').mockReturnValue(of(mockCards));

      // Call startGame with static mode
      await service.startGame('hr', GameMode.New, 'classic', true, null);

      // Verify that startGame was called with flashcards containing empty definition
      expect(gameStoreMock.startGame).toHaveBeenCalled();

      const callArgs = gameStoreMock.startGame.mock.calls[0];
      const flashcards = callArgs[1];

      // Check that the flashcard has empty definition
      expect(flashcards[0].definition).toBe('');
    });
  });
});
