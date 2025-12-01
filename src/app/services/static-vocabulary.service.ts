import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';

export interface VocabularyItem {
  english: string;
  polish: string;
  difficulty: number;
}

@Injectable({
  providedIn: 'root'
})
export class StaticVocabularyService {
  constructor(private http: HttpClient) {}

  loadVocabulary(): Observable<VocabularyItem[]> {
    return this.http.get<VocabularyItem[]>('hr_eng_pl/vocabulary.json');
  }

  generateWords(theme: string, count: number, difficulty?: number): Observable<{english: string, translations: Record<string, string>}[]> {
    return this.loadVocabulary().pipe(
      map(vocab => {
        // Filter by theme if needed, but since it's HR, just return random
        let filtered = vocab;

        // Filter by difficulty if specified
        if (difficulty !== undefined) {
          filtered = vocab.filter(item => item.difficulty === difficulty);
        }

        // If no words match the difficulty, fall back to all words
        if (filtered.length === 0) {
          filtered = vocab;
        }

        const shuffled = [...filtered].sort(() => Math.random() - 0.5);
        return shuffled.slice(0, count).map(item => ({
          english: item.english,
          translations: { polish: item.polish }
        }));
      })
    );
  }
}
