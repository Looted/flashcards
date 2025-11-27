import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TextGenerationSingleton, TranslationSingleton } from './ai-models';

// Mock the @huggingface/transformers module
vi.mock('@huggingface/transformers', () => ({
  pipeline: vi.fn(),
  env: {
    allowLocalModels: false
  }
}));

describe('TextGenerationSingleton', () => {
  beforeEach(() => {
    // Reset the singleton instance before each test
    TextGenerationSingleton.instance = undefined;
  });

  it('should have correct static properties', () => {
    expect(TextGenerationSingleton.task).toBe('text-generation');
    expect(TextGenerationSingleton.model).toBe('onnx-community/granite-4.0-micro-ONNX-web');
  });

  it('should return the same instance on multiple calls', async () => {
    const { pipeline } = await import('@huggingface/transformers');
    const mockPipeline = vi.fn().mockResolvedValue('mock-pipeline-instance');

    (pipeline as any).mockImplementation(mockPipeline);

    const instance1 = await TextGenerationSingleton.getInstance();
    const instance2 = await TextGenerationSingleton.getInstance();

    expect(instance1).toBe(instance2);
    expect(instance1).toBe('mock-pipeline-instance');
    expect(mockPipeline).toHaveBeenCalledTimes(1); // Should only create once
  });

  it('should call pipeline with correct parameters', async () => {
    const { pipeline } = await import('@huggingface/transformers');
    const mockPipeline = vi.fn().mockResolvedValue('mock-pipeline-instance');
    const mockProgressCallback = vi.fn();

    (pipeline as any).mockImplementation(mockPipeline);

    await TextGenerationSingleton.getInstance(mockProgressCallback);

    expect(mockPipeline).toHaveBeenCalledWith('text-generation', 'onnx-community/granite-4.0-micro-ONNX-web', {
      device: 'cpu',
      progress_callback: mockProgressCallback,
      dtype: "q4f16"
    });
  });
});

describe('TranslationSingleton', () => {
  beforeEach(() => {
    // Reset the singleton instance before each test
    TranslationSingleton.instance = undefined;
  });

  it('should have correct static properties', () => {
    expect(TranslationSingleton.task).toBe('translation');
    expect(TranslationSingleton.model).toBe('Xenova/nllb-200-distilled-600M');
  });

  it('should return the same instance on multiple calls', async () => {
    const { pipeline } = await import('@huggingface/transformers');
    const mockPipeline = vi.fn().mockResolvedValue('mock-translation-instance');

    (pipeline as any).mockImplementation(mockPipeline);

    const instance1 = await TranslationSingleton.getInstance();
    const instance2 = await TranslationSingleton.getInstance();

    expect(instance1).toBe(instance2);
    expect(instance1).toBe('mock-translation-instance');
    expect(mockPipeline).toHaveBeenCalledTimes(1); // Should only create once
  });

  it('should call pipeline with correct parameters', async () => {
    const { pipeline } = await import('@huggingface/transformers');
    const mockPipeline = vi.fn().mockResolvedValue('mock-translation-instance');
    const mockProgressCallback = vi.fn();

    (pipeline as any).mockImplementation(mockPipeline);

    await TranslationSingleton.getInstance(mockProgressCallback);

    expect(mockPipeline).toHaveBeenCalledWith('translation', 'Xenova/nllb-200-distilled-600M', {
      device: 'wasm',
      progress_callback: mockProgressCallback,
      dtype: "q8"
    });
  });
});
