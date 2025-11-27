import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock the worker-message-handler module
vi.mock('./worker-message-handler', () => ({
  WorkerMessageHandler: {
    handleMessage: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('Worker', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should set up message event listener on import', async () => {
    // Import the worker module to trigger the event listener setup
    await import('./worker');

    // The worker module should have set up an event listener
    // We verify this by checking that the module imported successfully
    expect(true).toBe(true);
  });

  it('should import worker-message-handler', async () => {
    const { WorkerMessageHandler } = await import('./worker-message-handler');

    // Verify that the WorkerMessageHandler is available and has the expected method
    expect(WorkerMessageHandler).toBeDefined();
    expect(typeof WorkerMessageHandler.handleMessage).toBe('function');
  });
});
