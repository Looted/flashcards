import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { AiWordGenerationService } from './ai-word-generation';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

describe('AiWordGenerationService', () => {
  let service: AiWordGenerationService;
  let mockWorker: any;
  let originalWorker: any;

  beforeEach(() => {
    // Mock Worker globally
    originalWorker = global.Worker;

    mockWorker = {
      postMessage: vi.fn(),
      terminate: vi.fn(),
      addEventListener: vi.fn((event, handler) => {
        if (event === 'message') {
          mockWorker.onmessage = handler;
        } else if (event === 'error') {
          mockWorker.onerror = handler;
        }
      }),
      removeEventListener: vi.fn(),
      onmessage: null,
      onerror: null
    };

    global.Worker = vi.fn(function () { return mockWorker; }) as any;

    TestBed.configureTestingModule({
      providers: [
        AiWordGenerationService,
        { provide: PLATFORM_ID, useValue: 'browser' }
      ]
    });
    service = TestBed.inject(AiWordGenerationService);
  });

  afterEach(() => {
    global.Worker = originalWorker;
  });

  describe('generateWords', () => {
    it('should generate words with theme and count', async () => {
      const resultPromise = service.generateWords('IT', 2);

      // Simulate worker completion
      setTimeout(() => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({
            data: {
              status: 'complete',
              pairs: [
                { english: 'computer', polish: 'komputer', difficulty: 'beginner' },
                { english: 'software', polish: 'oprogramowanie', difficulty: 'intermediate' }
              ]
            }
          });
        }
      }, 0);

      const result = await resultPromise;

      expect(global.Worker).toHaveBeenCalled();
      expect(result).toEqual([
        { english: 'computer', polish: 'komputer', difficulty: 'beginner' },
        { english: 'software', polish: 'oprogramowanie', difficulty: 'intermediate' }
      ]);
      expect(mockWorker.postMessage).toHaveBeenCalledWith({ theme: 'IT', count: 2, difficulty: undefined });
      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should handle difficulty parameter', async () => {
      const resultPromise = service.generateWords('IT', 1, undefined, 3);

      setTimeout(() => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({
            data: {
              status: 'complete',
              pairs: [{ english: 'test', polish: 'test', difficulty: 'advanced' }]
            }
          });
        }
      }, 0);

      await resultPromise;

      expect(mockWorker.postMessage).toHaveBeenCalledWith({ theme: 'IT', count: 1, difficulty: 3 });
    });

    it('should handle progress callback', async () => {
      const progressCallback = vi.fn();
      const resultPromise = service.generateWords('IT', 1, progressCallback);

      // Send progress update
      setTimeout(() => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({
            data: {
              status: 'progress',
              progress: 50
            }
          });
        }
      }, 0);

      // Then completion
      setTimeout(() => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({
            data: {
              status: 'complete',
              pairs: [{ english: 'test', polish: 'test', difficulty: 'beginner' }]
            }
          });
        }
      }, 10);

      await resultPromise;

      expect(progressCallback).toHaveBeenCalledWith({
        step: 'loading_model',
        progress: 50,
        message: 'Loading model...'
      });
    });

    it('should handle worker error', async () => {
      const resultPromise = service.generateWords('IT', 1);

      setTimeout(() => {
        if (mockWorker.onmessage) {
          mockWorker.onmessage({
            data: {
              status: 'error',
              error: 'Test error'
            }
          });
        }
      }, 0);

      await expect(resultPromise).rejects.toThrow('Test error');
      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should handle worker error event', async () => {
      const resultPromise = service.generateWords('IT', 1);

      setTimeout(() => {
        if (mockWorker.onerror) {
          mockWorker.onerror(new Error('Worker error'));
        }
      }, 0);

      await expect(resultPromise).rejects.toThrow('Worker error');
      expect(mockWorker.terminate).toHaveBeenCalled();
    });

    it('should use fallback words on server platform', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AiWordGenerationService,
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });

      service = TestBed.inject(AiWordGenerationService);

      const result = await service.generateWords('IT', 3);

      expect(result).toHaveLength(3);
      expect(result[0]).toEqual({ english: 'computer', translations: { polish: 'komputer' }, difficulty: 'beginner' });
      expect(result[1]).toEqual({ english: 'software', translations: { polish: 'oprogramowanie' }, difficulty: 'beginner' });
      expect(result[2]).toEqual({ english: 'internet', translations: { polish: 'internet' }, difficulty: 'beginner' });
    });

    it('should handle unknown theme with fallback to IT', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AiWordGenerationService,
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });

      service = TestBed.inject(AiWordGenerationService);

      const result = await service.generateWords('Unknown', 2);

      expect(result).toHaveLength(2);
      expect(result[0].english).toBe('computer');
    });

    it('should return all fallback words when count exceeds available', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AiWordGenerationService,
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });

      service = TestBed.inject(AiWordGenerationService);

      const result = await service.generateWords('IT', 20);

      expect(result).toHaveLength(10); // IT theme has 10 words
    });

    it('should handle all theme fallbacks correctly', async () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [
          AiWordGenerationService,
          { provide: PLATFORM_ID, useValue: 'server' }
        ]
      });

      service = TestBed.inject(AiWordGenerationService);

      const themes = ['IT', 'HR', 'Business', 'Medical'];

      for (const theme of themes) {
        const result = await service.generateWords(theme, 1);
        expect(result).toHaveLength(1);
        expect(result[0]).toHaveProperty('english');
        expect(result[0]).toHaveProperty('translations');
        expect(result[0].translations).toHaveProperty('polish');
        expect(result[0]).toHaveProperty('difficulty');
        expect(['beginner', 'intermediate', 'advanced']).toContain(result[0].difficulty);
      }
    });
  });
});
