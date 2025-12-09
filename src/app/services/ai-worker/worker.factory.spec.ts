import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';

// Mock the Worker constructor properly
const mockWorker = vi.fn().mockImplementation(function (url: URL, options: any) {
  return {
    postMessage: vi.fn(),
    terminate: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    // Store the URL and options for verification
    _url: url,
    _options: options
  };
});
global.Worker = mockWorker;

describe('Worker Factory', () => {
  let createAiWorker: any;
  let mockWorkerInstance: any;

  beforeAll(async () => {
    // Import the factory function
    const factory = await import('./worker.factory');
    createAiWorker = factory.createAiWorker;
  });

  beforeEach(() => {
    // Reset the mock and create a fresh worker instance for each test
    mockWorker.mockClear();
    mockWorkerInstance = {
      postMessage: vi.fn(),
      terminate: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn()
    };
    mockWorker.mockImplementation(function (url: URL, options: any) {
      return {
        ...mockWorkerInstance,
        _url: url,
        _options: options
      };
    });
  });

  it('should create a new Worker instance', () => {
    const worker = createAiWorker();

    expect(mockWorker).toHaveBeenCalledTimes(1);
    expect(worker).toBeDefined();
    expect(typeof worker.postMessage).toBe('function');
    expect(typeof worker.terminate).toBe('function');
    expect(typeof worker.addEventListener).toBe('function');
    expect(typeof worker.removeEventListener).toBe('function');
  });

  it('should create worker with correct path', () => {
    const worker = createAiWorker();

    expect(mockWorker).toHaveBeenCalledWith(expect.any(URL), { type: 'module' });

    // Verify the URL and options are correct
    const callArgs = mockWorker.mock.calls[0];
    expect(callArgs[0]).toBeInstanceOf(URL);
    expect(callArgs[1]).toEqual({ type: 'module' });

    // Verify the worker has the expected structure
    expect(worker._url).toBeDefined();
    expect(worker._options).toEqual({ type: 'module' });
  });

  it('should return a worker-like object with expected methods', () => {
    const worker = createAiWorker();
    const expectedMethods = ['postMessage', 'terminate', 'addEventListener', 'removeEventListener'];

    expectedMethods.forEach(method => {
      expect(typeof worker[method]).toBe('function');
    });
  });

  it('should allow worker to be terminated', () => {
    const worker = createAiWorker();
    worker.terminate();

    expect(mockWorkerInstance.terminate).toHaveBeenCalledTimes(1);
  });

  it('should create workers with proper event handling methods', () => {
    const worker = createAiWorker();

    // Test that event methods are callable
    worker.addEventListener('message', vi.fn());
    worker.removeEventListener('message', vi.fn());

    expect(mockWorkerInstance.addEventListener).toHaveBeenCalledTimes(1);
    expect(mockWorkerInstance.removeEventListener).toHaveBeenCalledTimes(1);
  });
});
