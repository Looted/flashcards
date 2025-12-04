import { LanguageService } from '../../services/language.service';
import { createStandardGameMode, createBlitzGameMode } from './game-modes';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Game Modes', () => {
  let mockLanguageService: any;

  beforeEach(() => {
    mockLanguageService = {
      currentLanguage: vi.fn().mockReturnValue('pl')
    };
  });

  describe('createStandardGameMode', () => {
    it('should create a standard game mode with correct structure', () => {
      const result = createStandardGameMode(mockLanguageService);

      expect(result.id).toBe('standard');
      expect(result.description).toBe('Classic Learning Mode');
      expect(result.rounds).toBeDefined();
      expect(result.rounds.length).toBe(3);
    });

    it('should have recognition round with correct configuration', () => {
      const result = createStandardGameMode(mockLanguageService);
      const recognitionRound = result.rounds[0];

      expect(recognitionRound.id).toBe('recognition');
      expect(recognitionRound.name).toBe('Recognition');
      expect(recognitionRound.layout.templateId).toBe('flashcard_standard');
      expect(recognitionRound.layout.dataMap.primary).toBe('english');
      expect(recognitionRound.layout.dataMap.secondary).toBe('polish');
      expect(recognitionRound.inputSource).toBe('deck_start');
      expect(recognitionRound.completionCriteria.requiredSuccesses).toBe(1);
      expect(recognitionRound.failureBehavior.action).toBe('requeue');
      expect(recognitionRound.failureBehavior.strategy).toBe('static_offset');
      expect(recognitionRound.failureBehavior.params).toEqual([3]);
    });

    it('should have recall round with correct configuration', () => {
      const result = createStandardGameMode(mockLanguageService);
      const recallRound = result.rounds[1];

      expect(recallRound.id).toBe('recall');
      expect(recallRound.name).toBe('Recall');
      expect(recallRound.layout.templateId).toBe('flashcard_standard');
      expect(recallRound.layout.dataMap.primary).toBe('polish');
      expect(recallRound.layout.dataMap.secondary).toBe('english');
      expect(recallRound.inputSource).toBe('deck_start');
      expect(recallRound.completionCriteria.requiredSuccesses).toBe(1);
      expect(recallRound.failureBehavior.action).toBe('requeue');
      expect(recallRound.failureBehavior.strategy).toBe('static_offset');
      expect(recallRound.failureBehavior.params).toEqual([3]);
    });

    it('should have writing round with correct configuration', () => {
      const result = createStandardGameMode(mockLanguageService);
      const writingRound = result.rounds[2];

      expect(writingRound.id).toBe('writing');
      expect(writingRound.name).toBe('Writing');
      expect(writingRound.layout.templateId).toBe('typing_challenge');
      expect(writingRound.layout.dataMap.primary).toBe('polish');
      expect(writingRound.layout.dataMap.secondary).toBe('english');
      expect(writingRound.inputSource).toBe('deck_start');
      expect(writingRound.completionCriteria.requiredSuccesses).toBe(1);
      expect(writingRound.failureBehavior.action).toBe('requeue');
      expect(writingRound.failureBehavior.strategy).toBe('static_offset');
      expect(writingRound.failureBehavior.params).toEqual([3]);
    });
  });

  describe('createBlitzGameMode', () => {
    it('should create a blitz game mode with correct structure', () => {
      const result = createBlitzGameMode(mockLanguageService);

      expect(result.id).toBe('blitz');
      expect(result.description).toBe('Blitz Mode - Fast Flipping');
      expect(result.rounds).toBeDefined();
      expect(result.rounds.length).toBe(2);
    });

    it('should have recognition round with correct configuration', () => {
      const result = createBlitzGameMode(mockLanguageService);
      const recognitionRound = result.rounds[0];

      expect(recognitionRound.id).toBe('recognition');
      expect(recognitionRound.name).toBe('Recognition');
      expect(recognitionRound.layout.templateId).toBe('flashcard_standard');
      expect(recognitionRound.layout.dataMap.primary).toBe('english');
      expect(recognitionRound.layout.dataMap.secondary).toBe('polish');
      expect(recognitionRound.inputSource).toBe('deck_start');
      expect(recognitionRound.completionCriteria.requiredSuccesses).toBe(1);
      expect(recognitionRound.failureBehavior.action).toBe('requeue');
      expect(recognitionRound.failureBehavior.strategy).toBe('static_offset');
      expect(recognitionRound.failureBehavior.params).toEqual([3]);
    });

    it('should have recall round with correct configuration', () => {
      const result = createBlitzGameMode(mockLanguageService);
      const recallRound = result.rounds[1];

      expect(recallRound.id).toBe('recall');
      expect(recallRound.name).toBe('Recall');
      expect(recallRound.layout.templateId).toBe('flashcard_standard');
      expect(recallRound.layout.dataMap.primary).toBe('polish');
      expect(recallRound.layout.dataMap.secondary).toBe('english');
      expect(recallRound.inputSource).toBe('deck_start');
      expect(recallRound.completionCriteria.requiredSuccesses).toBe(1);
      expect(recallRound.failureBehavior.action).toBe('requeue');
      expect(recallRound.failureBehavior.strategy).toBe('static_offset');
      expect(recallRound.failureBehavior.params).toEqual([3]);
    });
  });
});
