import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkerMessageHandler, WorkerRequest } from './worker-message-handler';

// Mock the @huggingface/transformers module
vi.mock('@huggingface/transformers', () => ({
  pipeline: vi.fn(),
  env: {
    allowLocalModels: false
  }
}));

// Mock the modules
const mockParseExamples = vi.fn();

vi.mock('./text-parser', () => ({
  TextParser: {
    parseExamples: mockParseExamples
  }
}));

// Mock self.postMessage
const mockPostMessage = vi.fn();
global.self = {
  postMessage: mockPostMessage
} as any;

describe('WorkerMessageHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton instances
    require('./ai-models').TextGenerationSingleton.instance = undefined;
    require('./ai-models').TranslationSingleton.instance = undefined;
  });

  describe('handleMessage', () => {
    it('should handle successful message processing', async () => {
      const { pipeline } = await import('@huggingface/transformers');
      const mockGenerator = vi.fn().mockResolvedValue([{
        generated_text: [{
          content: 'Scene: Test scene\nSentence: Test sentence\nVocabulary: test'
        }]
      }]);

      const mockTranslator = vi.fn().mockResolvedValue([{
        translation_text: 'test-polish'
      }]);

      (pipeline as any).mockImplementation((task: string) => {
        if (task === 'text-generation') return mockGenerator;
        if (task === 'translation') return mockTranslator;
        return undefined;
      });

      mockParseExamples.mockReturnValue([
        { sentence: 'Test sentence', vocabulary: 'test' }
      ]);

      const event = {
        data: { theme: 'IT', count: 1 }
      } as MessageEvent<WorkerRequest>;

      await WorkerMessageHandler.handleMessage(event);

      expect(mockPostMessage).toHaveBeenCalledWith({
        status: 'complete',
        pairs: [{ english: 'test', polish: 'test-polish' }]
      });
    });

    it('should handle translation failure with fallback', async () => {
      const { pipeline } = await import('@huggingface/transformers');
      const mockGenerator = vi.fn().mockResolvedValue([{
        generated_text: [{
          content: 'Scene: Test scene\nSentence: Test sentence\nVocabulary: test'
        }]
      }]);

      const mockTranslator = vi.fn().mockRejectedValue(new Error('Translation failed'));

      (pipeline as any).mockImplementation((task: string) => {
        if (task === 'text-generation') return mockGenerator;
        if (task === 'translation') return mockTranslator;
        return undefined;
      });

      mockParseExamples.mockReturnValue([
        { sentence: 'Test sentence', vocabulary: 'test' }
      ]);

      const event = {
        data: { theme: 'IT', count: 1 }
      } as MessageEvent<WorkerRequest>;

      await WorkerMessageHandler.handleMessage(event);

      expect(mockPostMessage).toHaveBeenCalledWith({
        status: 'complete',
        pairs: [{ english: 'test', polish: 'test' }] // Fallback to original word
      });
    });

    it('should handle missing translation result', async () => {
      const { pipeline } = await import('@huggingface/transformers');
      const mockGenerator = vi.fn().mockResolvedValue([{
        generated_text: [{
          content: 'Scene: Test scene\nSentence: Test sentence\nVocabulary: test'
        }]
      }]);

      const mockTranslator = vi.fn().mockResolvedValue([{
        translation_text: null
      }]);

      (pipeline as any).mockImplementation((task: string) => {
        if (task === 'text-generation') return mockGenerator;
        if (task === 'translation') return mockTranslator;
        return undefined;
      });

      mockParseExamples.mockReturnValue([
        { sentence: 'Test sentence', vocabulary: 'test' }
      ]);

      const event = {
        data: { theme: 'IT', count: 1 }
      } as MessageEvent<WorkerRequest>;

      await WorkerMessageHandler.handleMessage(event);

      expect(mockPostMessage).toHaveBeenCalledWith({
        status: 'complete',
        pairs: [{ english: 'test', polish: 'test' }] // Fallback to original word
      });
    });

    it('should limit results to requested count', async () => {
      const { pipeline } = await import('@huggingface/transformers');
      const mockGenerator = vi.fn().mockResolvedValue([{
        generated_text: [{
          content: 'Scene: Test scene 1\nSentence: Test sentence 1\nVocabulary: test1\n\nScene: Test scene 2\nSentence: Test sentence 2\nVocabulary: test2\n\nScene: Test scene 3\nSentence: Test sentence 3\nVocabulary: test3'
        }]
      }]);

      const mockTranslator = vi.fn()
        .mockResolvedValueOnce([{ translation_text: 'Test sentence 1 === test1-polish' }])
        .mockResolvedValueOnce([{ translation_text: 'Test sentence 2 === test2-polish' }]);

      (pipeline as any).mockImplementation((task: string) => {
        if (task === 'text-generation') return mockGenerator;
        if (task === 'translation') return mockTranslator;
        return undefined;
      });

      mockParseExamples.mockReturnValue([
        { sentence: 'Test sentence 1', vocabulary: 'test1' },
        { sentence: 'Test sentence 2', vocabulary: 'test2' },
        { sentence: 'Test sentence 3', vocabulary: 'test3' }
      ]);

      const event = {
        data: { theme: 'IT', count: 2 }
      } as MessageEvent<WorkerRequest>;

      await WorkerMessageHandler.handleMessage(event);

      expect(mockTranslator).toHaveBeenCalledTimes(2); // Only called for first 2 items
      expect(mockPostMessage).toHaveBeenCalledWith({
        status: 'complete',
        pairs: [
          { english: 'test1', polish: 'test1-polish' },
          { english: 'test2', polish: 'test2-polish' }
        ]
      });
    });

    it('should handle errors during processing', async () => {
      const { pipeline } = await import('@huggingface/transformers');
      (pipeline as any).mockRejectedValue(new Error('Pipeline error'));

      const event = {
        data: { theme: 'IT', count: 1 }
      } as MessageEvent<WorkerRequest>;

      await WorkerMessageHandler.handleMessage(event);

      expect(mockPostMessage).toHaveBeenCalledWith({
        status: 'error',
        error: 'Pipeline error'
      });
    });

    it('should handle non-Error exceptions', async () => {
      const { pipeline } = await import('@huggingface/transformers');
      (pipeline as any).mockRejectedValue('String error');

      const event = {
        data: { theme: 'IT', count: 1 }
      } as MessageEvent<WorkerRequest>;

      await WorkerMessageHandler.handleMessage(event);

      expect(mockPostMessage).toHaveBeenCalledWith({
        status: 'error',
        error: 'Unknown error'
      });
    });

    it('should send progress messages during generation', async () => {
      const { pipeline } = await import('@huggingface/transformers');
      const mockGenerator = vi.fn().mockResolvedValue([{
        generated_text: [{
          content: 'Scene: Test scene\nSentence: Test sentence\nVocabulary: test'
        }]
      }]);

      const mockTranslator = vi.fn().mockResolvedValue([{
        translation_text: 'test-polish'
      }]);

      (pipeline as any).mockImplementation((task: string, model: string, options: any) => {
        if (task === 'text-generation') {
          if (options?.progress_callback) {
            options.progress_callback({ step: 'generating', progress: 50 });
          }
          return mockGenerator;
        }
        if (task === 'translation') {
          if (options?.progress_callback) {
            options.progress_callback({ step: 'translating', progress: 75 });
          }
          return mockTranslator;
        }
        return undefined;
      });

      mockParseExamples.mockReturnValue([
        { sentence: 'Test sentence', vocabulary: 'test' }
      ]);

      const event = {
        data: { theme: 'IT', count: 1 }
      } as MessageEvent<WorkerRequest>;

      await WorkerMessageHandler.handleMessage(event);

      expect(mockPostMessage).toHaveBeenCalledWith({ step: 'generating', progress: 50 });
      expect(mockPostMessage).toHaveBeenCalledWith({ step: 'translating', progress: 75 });
    });
  });
});
