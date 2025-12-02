import { TestBed } from '@angular/core/testing';
import { LanguageSwitcherComponent } from './language-switcher.component';
import { LanguageService } from '../../services/language.service';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('LanguageSwitcherComponent', () => {
  let component: LanguageSwitcherComponent;
  let languageServiceMock: any;

  beforeEach(async () => {
    languageServiceMock = {
      getSupportedLanguages: vi.fn().mockReturnValue(['english', 'polish']),
      nativeLanguage: 'english',
      getLanguageDisplayName: vi.fn().mockImplementation((lang: string) => {
        switch (lang) {
          case 'english': return 'English';
          case 'polish': return 'Polski';
          default: return lang;
        }
      })
    };

    await TestBed.configureTestingModule({
      imports: [LanguageSwitcherComponent],
      providers: [
        { provide: LanguageService, useValue: languageServiceMock }
      ]
    })
    .compileComponents();

    const fixture = TestBed.createComponent(LanguageSwitcherComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('supportedLanguages', () => {
    it('should return supported languages from service', () => {
      expect(component.supportedLanguages()).toEqual(['english', 'polish']);
      expect(languageServiceMock.getSupportedLanguages).toHaveBeenCalled();
    });
  });

  describe('currentLanguage', () => {
    it('should return current native language', () => {
      expect(component.currentLanguage).toBe('english');
    });
  });

  describe('onLanguageChange', () => {
    it('should update native language when select changes', () => {
      const event = {
        target: { value: 'polish' }
      } as unknown as Event;

      component.onLanguageChange(event);

      expect(languageServiceMock.nativeLanguage).toBe('polish');
    });
  });

  describe('getLanguageDisplayName', () => {
    it('should delegate to language service', () => {
      const result = component.getLanguageDisplayName('polish');

      expect(languageServiceMock.getLanguageDisplayName).toHaveBeenCalledWith('polish');
      expect(result).toBe('Polski');
    });
  });
});
