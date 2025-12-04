import { TestBed } from '@angular/core/testing';
import { GameModeService } from './game-mode.service';
import { LanguageService } from './language.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('GameModeService', () => {
  let service: GameModeService;
  let mockLanguageService: any;

  beforeEach(() => {
    mockLanguageService = {
      currentLanguage: vi.fn().mockReturnValue('pl')
    };

    TestBed.configureTestingModule({
      providers: [
        GameModeService,
        { provide: LanguageService, useValue: mockLanguageService }
      ]
    });

    service = TestBed.inject(GameModeService);
  });

  describe('getGameMode', () => {
    it('should return standard game mode for classic type', () => {
      const result = service.getGameMode('classic');

      expect(result.id).toBe('standard');
      expect(result.description).toBe('Classic Learning Mode');
      expect(result.rounds).toBeDefined();
      expect(result.rounds.length).toBe(3);
    });

    it('should return blitz game mode for blitz type', () => {
      const result = service.getGameMode('blitz');

      expect(result.id).toBe('blitz');
      expect(result.description).toBe('Blitz Mode - Fast Flipping');
      expect(result.rounds).toBeDefined();
      expect(result.rounds.length).toBe(2);
    });

    it('should return standard game mode for unknown type (default case)', () => {
      const result = service.getGameMode('unknown' as any);

      expect(result.id).toBe('standard');
      expect(result.description).toBe('Classic Learning Mode');
      expect(result.rounds).toBeDefined();
      expect(result.rounds.length).toBe(3);
    });
  });

  describe('getStandardGameMode', () => {
    it('should return the same as getGameMode with classic', () => {
      const standardMode = service.getStandardGameMode();
      const classicMode = service.getGameMode('classic');

      expect(standardMode).toEqual(classicMode);
    });

    it('should return standard game mode structure', () => {
      const result = service.getStandardGameMode();

      expect(result.id).toBe('standard');
      expect(result.description).toBe('Classic Learning Mode');
      expect(result.rounds).toBeDefined();
      expect(result.rounds.length).toBe(3);
    });
  });
});
