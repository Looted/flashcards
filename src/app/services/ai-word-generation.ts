import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { createAiWorker } from './ai-worker';

export interface AIProgress {
  step: 'loading_model';
  progress?: number; // 0-100
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AiWordGenerationService {

  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  // Add progressCallback parameter
  async generateWords(
    theme: string,
    count: number = 10,
    progressCallback?: (info: AIProgress) => void
  ): Promise<{english: string, polish: string}[]> {

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

        worker.postMessage({ theme, count });

      } catch (error) {
        reject(error);
      }
    });
  }

  private getFallbackWords(theme: string, count: number): {english: string, polish: string}[] {
    // Fallback words organized by theme
    const fallbackThemes: Record<string, {english: string, polish: string}[]> = {
      'IT': [
        { english: 'computer', polish: 'komputer' },
        { english: 'software', polish: 'oprogramowanie' },
        { english: 'internet', polish: 'internet' },
        { english: 'database', polish: 'baza danych' },
        { english: 'algorithm', polish: 'algorytm' },
        { english: 'network', polish: 'sieć' },
        { english: 'server', polish: 'serwer' },
        { english: 'browser', polish: 'przeglądarka' },
        { english: 'keyboard', polish: 'klawiatura' },
        { english: 'mouse', polish: 'mysz' },
      ],
      'HR': [
        { english: 'employee', polish: 'pracownik' },
        { english: 'manager', polish: 'menedżer' },
        { english: 'interview', polish: 'wywiad' },
        { english: 'salary', polish: 'wynagrodzenie' },
        { english: 'recruitment', polish: 'rekrutacja' },
        { english: 'benefits', polish: 'świadczenia' },
        { english: 'performance', polish: 'wydajność' },
        { english: 'training', polish: 'szkolenie' },
        { english: 'contract', polish: 'umowa' },
        { english: 'vacation', polish: 'urlop' },
      ],
      'Business': [
        { english: 'meeting', polish: 'spotkanie' },
        { english: 'project', polish: 'projekt' },
        { english: 'budget', polish: 'budżet' },
        { english: 'strategy', polish: 'strategia' },
        { english: 'deadline', polish: 'termin' },
        { english: 'presentation', polish: 'prezentacja' },
        { english: 'client', polish: 'klient' },
        { english: 'profit', polish: 'zysk' },
        { english: 'investment', polish: 'inwestycja' },
        { english: 'partnership', polish: 'partnerstwo' },
      ],
      'Medical': [
        { english: 'doctor', polish: 'lekarz' },
        { english: 'patient', polish: 'pacjent' },
        { english: 'medicine', polish: 'lek' },
        { english: 'hospital', polish: 'szpital' },
        { english: 'diagnosis', polish: 'diagnoza' },
        { english: 'treatment', polish: 'leczenie' },
        { english: 'symptom', polish: 'objaw' },
        { english: 'prescription', polish: 'recepta' },
        { english: 'appointment', polish: 'wizyta' },
        { english: 'emergency', polish: 'nagły wypadek' },
      ]
    };

    const words = fallbackThemes[theme] || fallbackThemes['IT'];
    return words.slice(0, count);
  }
}
