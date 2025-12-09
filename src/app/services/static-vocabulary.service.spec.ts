import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { StaticVocabularyService } from './static-vocabulary.service';
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { firstValueFrom } from 'rxjs';

describe('StaticVocabularyService', () => {
  let service: StaticVocabularyService;
  let httpMock: HttpTestingController;

  const mockBaseData = [
    {
      id: '1',
      term: 'employee',
      definition: 'A person who works for a company',
      example: 'The employee works 40 hours per week.',
      metadata: { difficulty: 1, tags: ['hr'] }
    },
    {
      id: '2',
      term: 'salary',
      definition: 'Money paid to an employee',
      example: 'She receives a monthly salary.',
      metadata: { difficulty: 2, tags: ['hr'] }
    }
  ];

  const mockTranslationData = [
    {
      id: '1',
      term_translation: 'pracownik',
      definition_translation: 'Osoba pracująca w firmie',
      example_translation: 'Pracownik pracuje 40 godzin tygodniowo.'
    },
    {
      id: '2',
      term_translation: 'wynagrodzenie',
      definition_translation: 'Pieniądze wypłacane pracownikowi',
      example_translation: 'Otrzymuje miesięczne wynagrodzenie.'
    }
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [],
      providers: [StaticVocabularyService, provideHttpClientTesting()]
    });
    service = TestBed.inject(StaticVocabularyService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('getFilePrefix', () => {
    it('should return correct prefix for finance', () => {
      expect((service as any).getFilePrefix('finance')).toBe('fin');
    });

    it('should return lowercase topic for other categories', () => {
      expect((service as any).getFilePrefix('tech')).toBe('tech');
      expect((service as any).getFilePrefix('HR')).toBe('hr');
    });
  });

  describe('loadTranslationData', () => {
    it('should load base English data for English language', async () => {
      const resultPromise = firstValueFrom(service.loadTranslationData('hr', 'english'));

      const req = httpMock.expectOne('/i18n/hr_en.json');
      expect(req.request.method).toBe('GET');
      req.flush(mockBaseData);

      const result = await resultPromise;

      expect(result).toEqual(mockBaseData);
    });

    it('should load and merge translation data for non-English languages', async () => {
      const resultPromise = firstValueFrom(service.loadTranslationData('hr', 'polish'));

      // First request for base data
      const baseReq = httpMock.expectOne('/i18n/hr_en.json');
      baseReq.flush(mockBaseData);

      // Second request for translation data
      const translationReq = httpMock.expectOne('/i18n/hr_pl.json');
      translationReq.flush(mockTranslationData);

      const result = await resultPromise;

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        ...mockBaseData[0],
        term_translation: 'pracownik',
        definition_translation: 'Osoba pracująca w firmie',
        example_translation: 'Pracownik pracuje 40 godzin tygodniowo.'
      });
    });

    it('should fall back to base data when translation fails', async () => {
      const resultPromise = firstValueFrom(service.loadTranslationData('hr', 'polish'));

      const baseReq = httpMock.expectOne('/i18n/hr_en.json');
      baseReq.flush(mockBaseData);

      const translationReq = httpMock.expectOne('/i18n/hr_pl.json');
      translationReq.error(new ErrorEvent('Network error'));

      const result = await resultPromise;

      expect(result).toEqual(mockBaseData);
    });

    it('should use correct file prefix for finance category', async () => {
      const resultPromise = firstValueFrom(service.loadTranslationData('finance', 'english'));

      const req = httpMock.expectOne('/i18n/fin_en.json');
      req.flush(mockBaseData);

      const result = await resultPromise;

      expect(result).toEqual(mockBaseData);
    });
  });

  describe('generateTranslatedWords', () => {
    it('should generate translated words from merged data', async () => {
      const resultPromise = firstValueFrom(service.generateTranslatedWords('hr', 'polish', 2));

      const baseReq = httpMock.expectOne('/i18n/hr_en.json');
      baseReq.flush(mockBaseData);

      const translationReq = httpMock.expectOne('/i18n/hr_pl.json');
      translationReq.flush(mockTranslationData);

      const result = await resultPromise;

      expect(result).toHaveLength(2);

      // Check that we have both expected items (order may vary due to shuffling)
      const resultItems = result.map(item => item.english);
      expect(resultItems).toContain('employee');
      expect(resultItems).toContain('salary');

      // Find and verify the employee item
      const employeeItem = result.find(item => item.english === 'employee');
      expect(employeeItem).toBeDefined();
      expect(employeeItem?.translations).toEqual({
        english: 'employee',
        polish: 'pracownik',
        spanish: 'pracownik',
        german: 'pracownik',
        french: 'pracownik',
        definition_english: 'A person who works for a company',
        definition_polish: 'Osoba pracująca w firmie',
        example_polish: 'Pracownik pracuje 40 godzin tygodniowo.'
      });

      // Find and verify the salary item
      const salaryItem = result.find(item => item.english === 'salary');
      expect(salaryItem).toBeDefined();
      expect(salaryItem?.translations).toEqual({
        english: 'salary',
        polish: 'wynagrodzenie',
        spanish: 'wynagrodzenie',
        german: 'wynagrodzenie',
        french: 'wynagrodzenie',
        definition_english: 'Money paid to an employee',
        definition_polish: 'Pieniądze wypłacane pracownikowi',
        example_polish: 'Otrzymuje miesięczne wynagrodzenie.'
      });
    });

    it('should filter by difficulty when specified', async () => {
      const resultPromise = firstValueFrom(service.generateTranslatedWords('hr', 'polish', 10, 2));

      const baseReq = httpMock.expectOne('/i18n/hr_en.json');
      baseReq.flush(mockBaseData);

      const translationReq = httpMock.expectOne('/i18n/hr_pl.json');
      translationReq.flush(mockTranslationData);

      const result = await resultPromise;

      expect(result).toHaveLength(1);
      expect(result[0].english).toBe('salary');
    });

    it('should fall back to all words when no words match difficulty', async () => {
      const resultPromise = firstValueFrom(service.generateTranslatedWords('hr', 'polish', 2, 99));

      const baseReq = httpMock.expectOne('/i18n/hr_en.json');
      baseReq.flush(mockBaseData);

      const translationReq = httpMock.expectOne('/i18n/hr_pl.json');
      translationReq.flush(mockTranslationData);

      const result = await resultPromise;

      expect(result).toHaveLength(2);
    });
  });
});
