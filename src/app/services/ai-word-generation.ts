import { Injectable } from '@angular/core';
import { createAiWorker } from './ai-worker';

@Injectable({
  providedIn: 'root'
})
export class AiWordGenerationService {
  async generateWords(theme: string, count: number = 10, progressCallback?: (x: any) => void): Promise<{english: string, polish: string}[]> {
    return new Promise((resolve, reject) => {
      try {
        console.log('Creating AI worker for word generation...');
        const worker = createAiWorker();

        // Handle progress updates
        if (progressCallback) {
          worker.addEventListener('message', (event) => {
            const data = event.data;
            if (data.status === 'complete') {
              worker.terminate();
              resolve(data.pairs);
            } else {
              // Forward progress updates
              progressCallback(data);
            }
          });
        } else {
          worker.addEventListener('message', (event) => {
            const data = event.data;
            if (data.status === 'complete') {
              worker.terminate();
              resolve(data.pairs);
            }
          });
        }

        // Handle errors
        worker.addEventListener('error', (error) => {
          worker.terminate();
          reject(error);
        });

        // Send request to worker
        worker.postMessage({ theme, count });

      } catch (error) {
        reject(error);
      }
    });
  }
}
