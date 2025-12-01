import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createAiWorker } from './ai-worker/worker.factory';

export interface AIProgress {
  step: 'loading_model';
  progress?: number; // 0-100
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiWordGenerationService {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) { }

  // Add progressCallback parameter
  async generateWords(
    theme: string,
    count: number = 10,
    progressCallback?: (info: AIProgress) => void,
    difficulty?: number | null
  ): Promise<{ english: string, translations: Record<string, string>, difficulty: 'beginner' | 'intermediate' | 'advanced' }[]> {

    if (!isPlatformBrowser(this.platformId)) {
      console.log('Skipping AI word generation during SSR, using fallback words');
      return this.getFallbackWords(theme, count);
    }

    return new Promise((resolve, reject) => {
      try {
        console.log('Creating AI worker for word generation...');
        const worker = createAiWorker();

        worker.addEventListener('message', (event) => {
          const data = event.data;

          // Handle completion
          if (data.status === 'complete') {
            worker.terminate();
            resolve(data.pairs);
            return;
          }

          // Handle error
          if (data.status === 'error') {
            worker.terminate();
            reject(new Error(data.error));
            return;
          }

          // Handle progress updates (custom step messages from worker)
          if (progressCallback && (data.status === 'progress')) {
            // Map worker internal structure to our UI interface
            // Worker sends: { status: 'progress', progress: 45, ... }
            progressCallback({
              step: 'loading_model',
              progress: data.progress, // Ensure your worker sends this numeric value if available
              message: 'Loading model...'
            });
          }
        });

        worker.addEventListener('error', (error) => {
          worker.terminate();
          reject(error);
        });

        worker.postMessage({ theme, count, difficulty });

      } catch (error) {
        reject(error);
      }
    });
  }

  private getFallbackWords(theme: string, count: number): { english: string, translations: Record<string, string>, difficulty: 'beginner' | 'intermediate' | 'advanced' }[] {
    // Fallback words organized by theme with difficulty levels
    const fallbackThemes: Record<string, { english: string, polish: string, difficulty: 'beginner' | 'intermediate' | 'advanced' }[]> = {
      'IT': [
        { english: 'computer', polish: 'komputer', difficulty: 'beginner' },
        { english: 'software', polish: 'oprogramowanie', difficulty: 'beginner' },
        { english: 'internet', polish: 'internet', difficulty: 'beginner' },
        { english: 'database', polish: 'baza danych', difficulty: 'intermediate' },
        { english: 'algorithm', polish: 'algorytm', difficulty: 'intermediate' },
        { english: 'network', polish: 'sieć', difficulty: 'intermediate' },
        { english: 'server', polish: 'serwer', difficulty: 'intermediate' },
        { english: 'browser', polish: 'przeglądarka', difficulty: 'beginner' },
        { english: 'keyboard', polish: 'klawiatura', difficulty: 'beginner' },
        { english: 'mouse', polish: 'mysz', difficulty: 'beginner' },
      ],
      'HR': [
        { english: 'employee', polish: 'pracownik', difficulty: 'beginner' },
        { english: 'manager', polish: 'menedżer', difficulty: 'beginner' },
        { english: 'interview', polish: 'wywiad', difficulty: 'intermediate' },
        { english: 'salary', polish: 'wynagrodzenie', difficulty: 'intermediate' },
        { english: 'recruitment', polish: 'rekrutacja', difficulty: 'advanced' },
        { english: 'benefits', polish: 'świadczenia', difficulty: 'intermediate' },
        { english: 'performance', polish: 'wydajność', difficulty: 'intermediate' },
        { english: 'training', polish: 'szkolenie', difficulty: 'intermediate' },
        { english: 'contract', polish: 'umowa', difficulty: 'intermediate' },
        { english: 'vacation', polish: 'urlop', difficulty: 'beginner' },
      ],
      'Business': [
        { english: 'meeting', polish: 'spotkanie', difficulty: 'beginner' },
        { english: 'project', polish: 'projekt', difficulty: 'beginner' },
        { english: 'budget', polish: 'budżet', difficulty: 'intermediate' },
        { english: 'strategy', polish: 'strategia', difficulty: 'intermediate' },
        { english: 'deadline', polish: 'termin', difficulty: 'intermediate' },
        { english: 'presentation', polish: 'prezentacja', difficulty: 'intermediate' },
        { english: 'client', polish: 'klient', difficulty: 'beginner' },
        { english: 'profit', polish: 'zysk', difficulty: 'intermediate' },
        { english: 'investment', polish: 'inwestycja', difficulty: 'advanced' },
        { english: 'partnership', polish: 'partnerstwo', difficulty: 'intermediate' },
      ],
      'Medical': [
        { english: 'doctor', polish: 'lekarz', difficulty: 'beginner' },
        { english: 'patient', polish: 'pacjent', difficulty: 'beginner' },
        { english: 'medicine', polish: 'lek', difficulty: 'beginner' },
        { english: 'hospital', polish: 'szpital', difficulty: 'beginner' },
        { english: 'diagnosis', polish: 'diagnoza', difficulty: 'intermediate' },
        { english: 'treatment', polish: 'leczenie', difficulty: 'intermediate' },
        { english: 'symptom', polish: 'objaw', difficulty: 'intermediate' },
        { english: 'prescription', polish: 'recepta', difficulty: 'intermediate' },
        { english: 'appointment', polish: 'wizyta', difficulty: 'beginner' },
        { english: 'emergency', polish: 'nagły wypadek', difficulty: 'intermediate' },
      ]
    };

    const words = fallbackThemes[theme] || fallbackThemes['IT'];
    return words.slice(0, count).map(word => ({
      english: word.english,
      translations: { polish: word.polish },
      difficulty: word.difficulty
    }));
  }
}
