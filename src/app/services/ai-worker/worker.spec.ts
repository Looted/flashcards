import { describe, it, expect, vi } from 'vitest';

// Mock the worker-message-handler module
vi.mock('./worker-message-handler', () => ({
  WorkerMessageHandler: {
    handleMessage: vi.fn().mockResolvedValue(undefined)
  }
}));

describe('Worker', () => {
  it('should set up message event listener', async () => {
    // Mock self.addEventListener
    const mockAddEventListener = vi.fn();
    global.self = {
      addEventListener: mockAddEventListener
    } as any;

    // Import the worker module to trigger the event listener setup
    await import('./worker');

    // Verify that addEventListener was called with 'message' event
    expect(mockAddEventListener).toHaveBeenCalledWith('message', expect.any(Function));

    // Verify that the event listener is a function
    const eventListener = mockAddEventListener.mock.calls[0][1];
    expect(typeof eventListener).toBe('function');
  });
});
