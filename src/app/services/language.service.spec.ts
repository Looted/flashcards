import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';
import { PLATFORM_ID } from '@angular/core';
import { StorageService } from './storage.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('LanguageService', () => {
  let service: LanguageService;
  let mockStorageService: any;
  let mockNavigator: any;

  beforeEach(() => {
    mockStorageService = {
      getItem: vi.fn(),
      setItem: vi.fn()
    };

    mockNavigator = {
      language: 'pl-PL'
    };

    Object.defineProperty(window, 'navigator', {
      value: mockNavigator,
      writable: true
    });

    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: PLATFORM_ID, useValue: 'browser' },
        { provide: StorageService, useValue: mockStorageService }
      ]
    });

    service = TestBed.inject(LanguageService);
  });

  describe('Initialization', () => {
    it('should create service', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with pl as default native language', () => {
      expect(service.currentLanguage()).toBe('pl');
    });

    it('should load saved language from storage', async () => {
      mockStorageService.getItem.mockResolvedValue('es');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: StorageService, useValue: mockStorageService }
        ]
      });

      const newService = TestBed.inject(LanguageService);
      await new Promise(resolve => setTimeout(resolve, 0)); // Allow async initialization

      expect(mockStorageService.getItem).toHaveBeenCalledWith('nativeLanguage');
      expect(newService.currentLanguage()).toBe('es');
    });

    it('should detect browser language when no saved language', async () => {
      mockStorageService.getItem.mockResolvedValue(null);
      mockNavigator.language = 'es-ES';

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: StorageService, useValue: mockStorageService }
        ]
      });

      const newService = TestBed.inject(LanguageService);
      await new Promise(resolve => setTimeout(resolve, 0)); // Allow async initialization

      expect(newService.currentLanguage()).toBe('es');
    });

    it('should default to pl for unknown browser language', async () => {
      mockStorageService.getItem.mockResolvedValue(null);
      mockNavigator.language = 'zh-CN';

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: StorageService, useValue: mockStorageService }
        ]
      });

      const newService = TestBed.inject(LanguageService);
      await new Promise(resolve => setTimeout(resolve, 0)); // Allow async initialization

      expect(newService.currentLanguage()).toBe('pl');
    });

    it('should handle invalid saved language', async () => {
      mockStorageService.getItem.mockResolvedValue('invalid');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: PLATFORM_ID, useValue: 'browser' },
          { provide: StorageService, useValue: mockStorageService }
        ]
      });

      const newService = TestBed.inject(LanguageService);
      await new Promise(resolve => setTimeout(resolve, 0)); // Allow async initialization

      expect(newService.currentLanguage()).toBe('pl'); // Should default to pl
    });
  });

  describe('setLanguage', () => {
    it('should set native language and save to storage', async () => {
      mockStorageService.setItem.mockResolvedValue(undefined);
      await service.setLanguage('es');

      expect(service.currentLanguage()).toBe('es');
      expect(mockStorageService.setItem).toHaveBeenCalledWith('nativeLanguage', 'es');
    });
  });

  describe('currentLanguage signal', () => {
    it('should return the signal', () => {
      const signal = service.currentLanguage;
      expect(signal).toBeDefined();
      expect(signal()).toBe('pl');
    });
  });

  describe('getLanguageDisplayName', () => {
    it('should return display name for pl', () => {
      expect(service.getLanguageDisplayName('pl')).toBe('Polski');
    });

    it('should return display name for es', () => {
      expect(service.getLanguageDisplayName('es')).toBe('Español');
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return all supported languages', () => {
      const languages = service.getSupportedLanguages();
      expect(languages).toEqual(['pl', 'es', 'de', 'fr']);
    });
  });

  describe('Server platform', () => {
    let serverStorageServiceMock: any;
    let serverNavigatorMock: any;

    beforeEach(() => {
      serverStorageServiceMock = {
        getItem: vi.fn(),
        setItem: vi.fn()
      };

      serverNavigatorMock = {
        language: 'pl-PL'
      };

      Object.defineProperty(window, 'navigator', {
        value: serverNavigatorMock,
        writable: true
      });
    });

    it('should not access storage on server platform', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: StorageService, useValue: serverStorageServiceMock }
        ]
      });

      const serverService = TestBed.inject(LanguageService);

      // Should not throw and should have default language
      expect(serverService.currentLanguage()).toBe('pl');
      expect(serverStorageServiceMock.getItem).not.toHaveBeenCalled();
    });

    it('should not save to storage on server platform when setting language', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: PLATFORM_ID, useValue: 'server' },
          { provide: StorageService, useValue: serverStorageServiceMock }
        ]
      });

      const serverService = TestBed.inject(LanguageService);
      await serverService.setLanguage('es');

      expect(serverStorageServiceMock.setItem).not.toHaveBeenCalled();
    });
  });
});
