import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, tap, catchError, throwError, switchMap, of } from 'rxjs';



export interface TranslationItem {
  id: string;
  term: string;
  definition: string;
  example: string;
  metadata: {
    difficulty: number;
    tags: string[];
  };
}

export interface TranslatedItem extends TranslationItem {
  term_translation?: string;
  definition_translation?: string;
  example_translation?: string;
}

@Injectable({
  providedIn: 'root'
})
export class StaticVocabularyService {
  constructor(private http: HttpClient) {}

  private getFilePrefix(topic: string): string {
    return topic.toLowerCase();
  }



  loadTranslationData(topic: string, language: string): Observable<TranslatedItem[]> {
    // Map topic to file prefix
    const topicPrefix = this.getFilePrefix(topic);

    // Always load English base data first
    const baseFilename = `${topicPrefix}_en.json`;
    const baseUrl = `/i18n/${baseFilename}`;

    console.log('[StaticVocabulary] Loading base English data from URL:', baseUrl);

    return this.http.get<TranslatedItem[]>(baseUrl).pipe(
      tap(data => console.log('[StaticVocabulary] Successfully loaded', data.length, 'base items')),
      switchMap(baseData => {
        // If language is English, return base data directly
        if (language === 'english') {
          return of(baseData);
        }

        // For other languages, load translation data and merge
        const langSuffix = language === 'polish' ? 'pl' : language === 'spanish' ? 'es' : language === 'german' ? 'de' : 'fr';
        const translationFilename = `${topicPrefix}_${langSuffix}.json`;
        const translationUrl = `/i18n/${translationFilename}`;

        console.log('[StaticVocabulary] Loading translation data from URL:', translationUrl);

        return this.http.get<any[]>(translationUrl).pipe(
          tap(translationData => console.log('[StaticVocabulary] Successfully loaded', translationData.length, 'translation items')),
          map(translationData => this.mergeTranslationData(baseData, translationData)),
          catchError(translationError => {
            console.error('[StaticVocabulary] Failed to load translation data from:', translationUrl);
            console.error('[StaticVocabulary] Error:', translationError);
            // Fall back to base data if translation fails
            return of(baseData);
          })
        );
      }),
      catchError(error => {
        console.error('[StaticVocabulary] Failed to load base data from:', baseUrl);
        console.error('[StaticVocabulary] Error:', error);
        return throwError(() => error);
      })
    );
  }

  private mergeTranslationData(baseData: TranslatedItem[], translationData: any[]): TranslatedItem[] {
    const translationMap = new Map<string, any>();
    translationData.forEach(item => {
      if (item.id) {
        translationMap.set(item.id, item);
      }
    });

    return baseData.map(baseItem => {
      const translationItem = translationMap.get(baseItem.id);
      if (translationItem) {
        return {
          ...baseItem,
          term_translation: translationItem.term,
          definition_translation: translationItem.definition,
          example_translation: translationItem.example
        };
      }
      return baseItem;
    });
  }



  generateTranslatedWords(theme: string, language: string, count: number, difficulty?: number): Observable<{english: string, translations: Record<string, string>}[]> {
    console.log('[StaticVocabulary] generateTranslatedWords called:', { theme, language, count, difficulty });

    return this.loadTranslationData(theme, language).pipe(
      map(translationData => {
        console.log('[StaticVocabulary] Processing translation data:', translationData.length, 'items');

        let filtered = translationData;

        // Filter by difficulty if specified
        if (difficulty !== undefined) {
          filtered = translationData.filter(item => item.metadata.difficulty === difficulty);
          console.log('[StaticVocabulary] Filtered by difficulty', difficulty, ':', filtered.length, 'items');
        }

        // If no words match the difficulty, fall back to all words
        if (filtered.length === 0) {
          console.warn('[StaticVocabulary] No translation items match difficulty, using all items');
          filtered = translationData;
        }

        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        const selected = shuffled.slice(0, count);

        console.log('[StaticVocabulary] Returning', selected.length, 'translated cards');

        return selected.map(item => {
          const translations: Record<string, string> = {
            english: item.term,
            polish: item.term_translation || item.term,
            spanish: item.term_translation || item.term,
            german: item.term_translation || item.term,
            french: item.term_translation || item.term
          };

          // Always add English definition from base data
          if (item.definition) {
            translations['definition_english'] = item.definition;
          }

          // Add translated definition and example if available
          if (item.definition_translation) {
            translations[`definition_${language}`] = item.definition_translation;
          }
          if (item.example_translation) {
            translations[`example_${language}`] = item.example_translation;
          }

          return {
            english: item.term,
            translations
          };
        });
      })
    );
  }
}
