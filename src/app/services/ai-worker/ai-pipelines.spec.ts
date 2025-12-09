import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the @huggingface/transformers module
vi.mock('@huggingface/transformers', () => {
  const mockPipeline = vi.fn(async (task) => {
    // Return mock instances immediately without delay
    if (task === 'text-generation') {
      return 'mock-pipeline-instance';
    } else if (task === 'translation') {
      return 'mock-translation-instance';
    }
    return undefined;
  });
  return {
    pipeline: mockPipeline,
    env: {
      allowLocalModels: false
    }
  };
});

import { TextGenerationPipelineFactory, TranslationPipelineFactory } from './ai-pipelines';
import { pipeline } from '@huggingface/transformers';

// Mock navigator.gpu for WebGPU availability check
Object.defineProperty(global.navigator, 'gpu', {
  value: {
    requestAdapter: vi.fn().mockResolvedValue({})
  },
  writable: true
});

describe('TextGenerationPipelineFactory', () => {
  beforeEach(() => {
    // Reset the singleton instance before each test
    TextGenerationPipelineFactory.instance = undefined;
    vi.clearAllMocks();
  });

  it('should have correct static properties', () => {
    expect(TextGenerationPipelineFactory.task).toBe('text-generation');
    expect(TextGenerationPipelineFactory.model).toBe('HuggingFaceTB/SmolLM2-360M-Instruct');
  });

  it('should return the same instance on multiple calls', async () => {
    const mockPipeline = vi.mocked(pipeline);
    (mockPipeline as any).mockResolvedValue('mock-pipeline-instance');

    const instance1 = await TextGenerationPipelineFactory.getInstance();
    const instance2 = await TextGenerationPipelineFactory.getInstance();

    expect(instance1).toBe(instance2);
    expect(instance1).toBe('mock-pipeline-instance');
    expect(mockPipeline).toHaveBeenCalledTimes(1); // Should only create once
  });

  it('should return existing instance without creating new pipeline', async () => {
    const mockPipeline = vi.mocked(pipeline);
    (mockPipeline as any).mockResolvedValue('mock-pipeline-instance');

    // First call creates the instance
    await TextGenerationPipelineFactory.getInstance();
    // Reset mock to check it's not called again
    mockPipeline.mockClear();

    // Second call should return existing instance
    const instance = await TextGenerationPipelineFactory.getInstance();

    expect(instance).toBe('mock-pipeline-instance');
    expect(mockPipeline).not.toHaveBeenCalled(); // Should not create again
  });

  it('should call pipeline with correct parameters', async () => {
    const mockPipeline = vi.mocked(pipeline);
    (mockPipeline as any).mockResolvedValue('mock-pipeline-instance');
    const mockProgressCallback = vi.fn();

    await TextGenerationPipelineFactory.getInstance(mockProgressCallback);

    expect(mockPipeline).toHaveBeenCalledWith('text-generation', 'HuggingFaceTB/SmolLM2-360M-Instruct', {
      device: 'webgpu',
      dtype: 'fp16',
      progress_callback: mockProgressCallback
    });
  });

  it('should use WASM device when WebGPU is not available', async () => {
    // Mock WebGPU as unavailable
    const originalGpu = global.navigator.gpu;
    Object.defineProperty(global.navigator, 'gpu', {
      value: {
        requestAdapter: vi.fn().mockResolvedValue(null)
      },
      writable: true
    });

    const mockPipeline = vi.mocked(pipeline);
    const mockProgressCallback = vi.fn();

    await TextGenerationPipelineFactory.getInstance(mockProgressCallback);

    expect(mockPipeline).toHaveBeenCalledWith('text-generation', 'HuggingFaceTB/SmolLM2-360M-Instruct', {
      device: 'wasm',
      dtype: 'q8',
      progress_callback: mockProgressCallback
    });

    // Restore original mock
    Object.defineProperty(global.navigator, 'gpu', {
      value: originalGpu,
      writable: true
    });
  });
});

describe('TranslationPipelineFactory', () => {
  beforeEach(() => {
    // Reset the singleton instance before each test
    TranslationPipelineFactory.instance = undefined;
    vi.clearAllMocks();
  });

  it('should have correct static properties', () => {
    expect(TranslationPipelineFactory.task).toBe('translation');
    expect(TranslationPipelineFactory.model).toBe('Xenova/nllb-200-distilled-600M');
  });

  it('should return the same instance on multiple calls', async () => {
    const mockPipeline = vi.mocked(pipeline);
    (mockPipeline as any).mockResolvedValue('mock-translation-instance');

    const instance1 = await TranslationPipelineFactory.getInstance();
    const instance2 = await TranslationPipelineFactory.getInstance();

    expect(instance1).toBe(instance2);
    expect(instance1).toBe('mock-translation-instance');
    expect(mockPipeline).toHaveBeenCalledTimes(1); // Should only create once
  });

  it('should return existing instance without creating new pipeline', async () => {
    const mockPipeline = vi.mocked(pipeline);
    (mockPipeline as any).mockResolvedValue('mock-translation-instance');

    // First call creates the instance
    await TranslationPipelineFactory.getInstance();
    // Reset mock to check it's not called again
    mockPipeline.mockClear();

    // Second call should return existing instance
    const instance = await TranslationPipelineFactory.getInstance();

    expect(instance).toBe('mock-translation-instance');
    expect(mockPipeline).not.toHaveBeenCalled(); // Should not create again
  });

  it('should call pipeline with correct parameters', async () => {
    const mockPipeline = vi.mocked(pipeline);
    (mockPipeline as any).mockResolvedValue('mock-translation-instance');
    const mockProgressCallback = vi.fn();

    await TranslationPipelineFactory.getInstance(mockProgressCallback);

    expect(mockPipeline).toHaveBeenCalledWith('translation', 'Xenova/nllb-200-distilled-600M', {
      device: 'wasm',
      progress_callback: mockProgressCallback,
      dtype: "q8"
    });
  });
});
