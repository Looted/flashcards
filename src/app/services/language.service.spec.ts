import { TestBed } from '@angular/core/testing';
import { LanguageService } from './language.service';
import { PLATFORM_ID } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('LanguageService', () => {
  let service: LanguageService;
  let mockLocalStorage: any;
  let mockNavigator: any;

  beforeEach(() => {
    mockLocalStorage = {
      getItem: vi.fn(),
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn()
    };

    mockNavigator = {
      language: 'pl-PL'
    };

    Object.defineProperty(window, 'localStorage', {
      value: mockLocalStorage,
      writable: true
    });

    Object.defineProperty(window, 'navigator', {
      value: mockNavigator,
      writable: true
    });

    TestBed.configureTestingModule({
      providers: [
        LanguageService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });

    service = TestBed.inject(LanguageService);
  });

  describe('Initialization', () => {
    it('should create service', () => {
      expect(service).toBeTruthy();
    });

    it('should initialize with polish as default native language', () => {
      expect(service.nativeLanguage).toBe('polish');
    });

    it('should load saved language from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('spanish');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });

      const newService = TestBed.inject(LanguageService);

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('nativeLanguage');
      expect(newService.nativeLanguage).toBe('spanish');
    });

    it('should detect browser language when no saved language', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockNavigator.language = 'es-ES';

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });

      const newService = TestBed.inject(LanguageService);

      expect(newService.nativeLanguage).toBe('spanish');
    });

    it('should default to polish for unknown browser language', () => {
      mockLocalStorage.getItem.mockReturnValue(null);
      mockNavigator.language = 'fr-FR';

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });

      const newService = TestBed.inject(LanguageService);

      expect(newService.nativeLanguage).toBe('polish');
    });

    it('should handle invalid saved language', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });

      const newService = TestBed.inject(LanguageService);

      expect(newService.nativeLanguage).toBe('polish'); // Should default to polish
    });
  });

  describe('nativeLanguage setter', () => {
    it('should set native language and save to localStorage', () => {
      service.nativeLanguage = 'spanish';

      expect(service.nativeLanguage).toBe('spanish');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('nativeLanguage', 'spanish');
    });
  });

  describe('nativeLanguageSignal', () => {
    it('should return the signal', () => {
      const signal = service.nativeLanguageSignal;
      expect(signal).toBeDefined();
      expect(signal()).toBe('polish');
    });
  });

  describe('getLanguageDisplayName', () => {
    it('should return display name for polish', () => {
      expect(service.getLanguageDisplayName('polish')).toBe('Polski');
    });

    it('should return display name for spanish', () => {
      expect(service.getLanguageDisplayName('spanish')).toBe('Español');
    });
  });

  describe('getSupportedLanguages', () => {
    it('should return all supported languages', () => {
      const languages = service.getSupportedLanguages();
      expect(languages).toEqual(['polish', 'spanish']);
    });
  });

  describe('Server platform', () => {
    let serverLocalStorageMock: any;
    let serverNavigatorMock: any;

    beforeEach(() => {
      serverLocalStorageMock = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn()
      };

      serverNavigatorMock = {
        language: 'pl-PL'
      };

      Object.defineProperty(window, 'localStorage', {
        value: serverLocalStorageMock,
        writable: true
      });

      Object.defineProperty(window, 'navigator', {
        value: serverNavigatorMock,
        writable: true
      });
    });

    it('should not access localStorage on server platform', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });

      const serverService = TestBed.inject(LanguageService);

      // Should not throw and should have default language
      expect(serverService.nativeLanguage).toBe('polish');
      expect(serverLocalStorageMock.getItem).not.toHaveBeenCalled();
    });

    it('should not save to localStorage on server platform when setting language', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });

      const serverService = TestBed.inject(LanguageService);
      serverService.nativeLanguage = 'spanish';

      expect(serverLocalStorageMock.setItem).not.toHaveBeenCalled();
    });
  });
});
