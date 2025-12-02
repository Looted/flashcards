import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkerOrchestrator, WorkerRequest } from './worker-orchestrator';
import { TextParser } from './text-parser';
import { PromptBuilder } from './prompt-builder';
import { TranslationService } from './translation-service';
import * as AIPipelines from './ai-pipelines';

// Mock the @huggingface/transformers module
vi.mock('@huggingface/transformers', () => ({
  pipeline: vi.fn(),
  env: {
    allowLocalModels: false
  }
}));



// Mock self.postMessage
const mockPostMessage = vi.fn();
global.self = {
  postMessage: mockPostMessage
} as any;

describe('WorkerOrchestrator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset singleton instances using imported module
    (AIPipelines.TextGenerationPipelineFactory as any).instance = undefined;
    (AIPipelines.TranslationPipelineFactory as any).instance = undefined;
  });

  describe('handleMessage', () => {
    it('should handle successful message processing', async () => {
      const { pipeline } = await import('@huggingface/transformers');

      const mockGenerator = vi.fn().mockResolvedValue([{
        generated_text: 'Difficulty: beginner\nVocabulary: test\nSentence: Test sentence'
      }]);

      (pipeline as any).mockImplementation((task: string) => {
        if (task === 'text-generation') return mockGenerator;
        return undefined;
      });

      vi.spyOn(PromptBuilder, 'buildPrompt').mockReturnValue([
        { role: "system", content: "You are an expert English teacher." },
        { role: "user", content: "Generate examples..." }
      ]);

      vi.spyOn(TextParser, 'parseExamples').mockReturnValue([
        { sentence: 'Test sentence', vocabulary: 'test', difficulty: 'beginner' }
      ]);

      vi.spyOn(TranslationService, 'translateExamples').mockResolvedValue([
        { english: 'test', polish: 'test-polish', difficulty: 'beginner' }
      ]);

      const event = {
        data: { theme: 'IT', count: 1 }
      } as MessageEvent<WorkerRequest>;

      await WorkerOrchestrator.handleMessage(event);

      expect(mockPostMessage).toHaveBeenCalledWith({
        status: 'complete',
        pairs: [{ english: 'test', polish: 'test-polish', difficulty: 'beginner' }]
      });
    });

    it('should handle errors during processing', async () => {
      const { pipeline } = await import('@huggingface/transformers');
      (pipeline as any).mockRejectedValue(new Error('Pipeline error'));

      const event = {
        data: { theme: 'IT', count: 1 }
      } as MessageEvent<WorkerRequest>;

      await WorkerOrchestrator.handleMessage(event);

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

      await WorkerOrchestrator.handleMessage(event);

      expect(mockPostMessage).toHaveBeenCalledWith({
        status: 'error',
        error: 'Unknown error'
      });
    });

    it('should send progress messages during generation', async () => {
      const { pipeline } = await import('@huggingface/transformers');

      const mockGenerator = vi.fn().mockResolvedValue([{
        generated_text: 'Difficulty: beginner\nVocabulary: test\nSentence: Test sentence'
      }]);

      (pipeline as any).mockImplementation((task: string, model: string, options: any) => {
        if (task === 'text-generation') {
          if (options?.progress_callback) {
            options.progress_callback({ step: 'generating', progress: 50 });
          }
          return mockGenerator;
        }
        return undefined;
      });

      vi.spyOn(PromptBuilder, 'buildPrompt').mockReturnValue([
        { role: "system", content: "You are an expert English teacher." },
        { role: "user", content: "Generate examples..." }
      ]);

      vi.spyOn(TextParser, 'parseExamples').mockReturnValue([
        { sentence: 'Test sentence', vocabulary: 'test', difficulty: 'beginner' }
      ]);

      vi.spyOn(TranslationService, 'translateExamples').mockImplementation(async (examples: any, count: any, progressCallback: any) => {
        progressCallback({ step: 'translating', progress: 75 });
        return [{ english: 'test', polish: 'test-polish', difficulty: 'beginner' }];
      });

      const event = {
        data: { theme: 'IT', count: 1 }
      } as MessageEvent<WorkerRequest>;

      await WorkerOrchestrator.handleMessage(event);

      expect(mockPostMessage).toHaveBeenCalledWith({ step: 'generating', progress: 50 });
      expect(mockPostMessage).toHaveBeenCalledWith({ step: 'translating', progress: 75 });
    });
  });
});
