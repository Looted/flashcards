import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WorkerOrchestrator, WorkerRequest } from './worker-orchestrator';
import { TextParser } from './text-parser';
import { PromptBuilder } from './prompt-builder';
import { TranslationService } from './translation-service';

// Mock the entire ai-pipelines module to return mock factories
vi.mock('./ai-pipelines', () => ({
  TextGenerationPipelineFactory: {
    getInstance: vi.fn(),
    instance: undefined
  },
  TranslationPipelineFactory: {
    getInstance: vi.fn(),
    instance: undefined
  }
}));

// Import after mocking
import * as AIPipelines from './ai-pipelines';



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
      const mockGenerator = vi.fn().mockResolvedValue([{
        generated_text: 'Difficulty: beginner\nVocabulary: test\nSentence: Test sentence'
      }]);

      // Mock the getInstance method directly
      vi.spyOn(AIPipelines.TextGenerationPipelineFactory, 'getInstance').mockResolvedValue(mockGenerator as any);
      vi.spyOn(AIPipelines.TranslationPipelineFactory, 'getInstance').mockResolvedValue(vi.fn() as any); // Mock translation pipeline

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
      const mockGenerator = vi.fn().mockRejectedValue(new Error('Pipeline error'));
      vi.spyOn(AIPipelines.TextGenerationPipelineFactory, 'getInstance').mockResolvedValue(mockGenerator as any);

      // Mock the prompt builder to return valid prompt
      vi.spyOn(PromptBuilder, 'buildPrompt').mockReturnValue([
        { role: "system", content: "You are an expert English teacher." },
        { role: "user", content: "Generate examples..." }
      ]);

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
      const mockGenerator = vi.fn().mockRejectedValue('String error');
      vi.spyOn(AIPipelines.TextGenerationPipelineFactory, 'getInstance').mockResolvedValue(mockGenerator as any);

      // Mock the prompt builder to return valid prompt
      vi.spyOn(PromptBuilder, 'buildPrompt').mockReturnValue([
        { role: "system", content: "You are an expert English teacher." },
        { role: "user", content: "Generate examples..." }
      ]);

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
      const mockGenerator = vi.fn().mockResolvedValue([{
        generated_text: 'Difficulty: beginner\nVocabulary: test\nSentence: Test sentence'
      }]);

      vi.spyOn(AIPipelines.TextGenerationPipelineFactory, 'getInstance').mockImplementation(async (progressCallback: any) => {
        if (progressCallback) {
          progressCallback({ step: 'generating', progress: 50 });
        }
        return mockGenerator as any;
      });

      vi.spyOn(AIPipelines.TranslationPipelineFactory, 'getInstance').mockResolvedValue(vi.fn() as any); // Mock translation pipeline

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
