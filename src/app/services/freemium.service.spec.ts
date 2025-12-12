import { TestBed } from '@angular/core/testing';
import { FreemiumService } from './freemium.service';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { VocabularyStatsService } from './vocabulary-stats.service';
import { StorageService } from './storage.service';
import { of } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('FreemiumService', () => {
  let service: FreemiumService;
  let storageServiceMock: any;
  let authServiceMock: any;

  beforeEach(() => {
    // Mock response with some free words
    const mockFreeWords = [
      { id: 'word1', term: 'word1', isFree: true, metadata: { difficulty: 1 } },
      { id: 'word2', term: 'word2', isFree: true, metadata: { difficulty: 1 } },
      { id: 'word3', term: 'word3', isFree: true, metadata: { difficulty: 1 } }
    ];

    const httpClientMock = {
      get: vi.fn().mockReturnValue(of(mockFreeWords))
    };

    authServiceMock = {
      isPremiumUser: vi.fn().mockReturnValue(false), // Default to free user
      currentUser: vi.fn().mockReturnValue({ uid: 'test-user' }),
      userProfileReady: vi.fn().mockReturnValue(true)
    };

    const vocabStatsServiceMock = {
      getAllStats: vi.fn().mockReturnValue([])
    };

    storageServiceMock = {
      getItem: vi.fn().mockReturnValue(null),
      setItem: vi.fn()
    };

    TestBed.configureTestingModule({
      providers: [
        FreemiumService,
        { provide: HttpClient, useValue: httpClientMock },
        { provide: AuthService, useValue: authServiceMock },
        { provide: VocabularyStatsService, useValue: vocabStatsServiceMock },
        { provide: StorageService, useValue: storageServiceMock }
      ]
    });

    service = TestBed.inject(FreemiumService);
  });

  describe('initialization', () => {
    it('should create the service without errors', () => {
      expect(service).toBeTruthy();
      expect(service.isLoadingFreemiumData()).toBeDefined();
    });

    it('should initialize with empty free word maps', () => {
      expect(service['freeWordsByCategory']().size).toBe(5);
    });
  });

  describe('Freemium Limits', () => {
    it('should allow playing if category is not exhausted', async () => {
      // This test verifies that the service allows playing when free words are available
      // The service is already initialized with mock data in beforeEach
      const canStart = await service.canStartNewGame('technology', 'blitz');
      expect(canStart).toBe(true);
    });

    it('should always allow premium users to play', async () => {
      authServiceMock.isPremiumUser.mockReturnValue(true);
      const canStart = await service.canStartNewGame('technology', 'blitz');
      expect(canStart).toBe(true);
    });

    it('should record session words for analytics tracking', () => {
      storageServiceMock.getItem.mockReturnValue('10');
      service.recordSessionWords('technology', 20);
      expect(storageServiceMock.setItem).toHaveBeenCalledWith('freemium_words_count', '30');
    });

    it('should start analytics tracking from 0 if storage is empty', () => {
      storageServiceMock.getItem.mockReturnValue(null);
      service.recordSessionWords('technology', 20);
      expect(storageServiceMock.setItem).toHaveBeenCalledWith('freemium_words_count', '20');
    });
  });
});
