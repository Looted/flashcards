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

    it('should initialize with pl as default native language', () => {
      expect(service.currentLanguage()).toBe('pl');
    });

    it('should load saved language from localStorage', () => {
      mockLocalStorage.getItem.mockReturnValue('es');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          LanguageService,
          { provide: PLATFORM_ID, useValue: 'browser' }
        ]
      });

      const newService = TestBed.inject(LanguageService);

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('nativeLanguage');
      expect(newService.currentLanguage()).toBe('es');
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

      expect(newService.currentLanguage()).toBe('es');
    });

    it('should default to pl for unknown browser language', () => {
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

      expect(newService.currentLanguage()).toBe('pl');
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

      expect(newService.currentLanguage()).toBe('pl'); // Should default to pl
    });
  });

  describe('setLanguage', () => {
    it('should set native language and save to localStorage', () => {
      service.setLanguage('es');

      expect(service.currentLanguage()).toBe('es');
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('nativeLanguage', 'es');
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
      expect(languages).toEqual(['pl', 'es']);
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
      expect(serverService.currentLanguage()).toBe('pl');
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
      serverService.setLanguage('es');

      expect(serverLocalStorageMock.setItem).not.toHaveBeenCalled();
    });
  });
});
