// @vitest-environment jsdom
import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { WorkerOrchestrator } from './worker-orchestrator';

describe('Worker', () => {
  let mockHandleMessage: any;
  let addEventListenerSpy: any;

  beforeAll(async () => {
    // Spy on the static method
    mockHandleMessage = vi.spyOn(WorkerOrchestrator, 'handleMessage').mockResolvedValue(undefined);

    // Mock self.addEventListener if it doesn't exist
    if (!self.addEventListener) {
      self.addEventListener = vi.fn();
    }

    // Spy on self.addEventListener
    addEventListenerSpy = vi.spyOn(self, 'addEventListener');

    // Import the worker module once to trigger the event listener setup
    await import('./worker');
  });

  afterAll(() => {
    // Restore the spy if it exists
    if (addEventListenerSpy?.mockRestore) {
      addEventListenerSpy.mockRestore();
    }
  });

  it('should set up message event listener', () => {
    // Verify that addEventListener was called with 'message' event
    expect(addEventListenerSpy).toHaveBeenCalledWith('message', expect.any(Function));

    // Verify that the event listener is a function
    const calls = addEventListenerSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const eventListener = calls[0][1];
    expect(typeof eventListener).toBe('function');
  });

  it('should handle message events by calling WorkerOrchestrator.handleMessage', async () => {
    // Get the event listener function
    const calls = addEventListenerSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const eventListener = calls[0][1];

    // Create a mock event
    const mockEvent = { data: 'test message' };

    // Call the event listener
    await eventListener(mockEvent);

    // Verify that WorkerOrchestrator.handleMessage was called with the event
    expect(mockHandleMessage).toHaveBeenCalledWith(mockEvent);
  });

  it('should handle async message processing', async () => {
    const calls = addEventListenerSpy.mock.calls;
    expect(calls.length).toBeGreaterThan(0);
    const eventListener = calls[0][1];
    const mockEvent = { data: 'async test' };

    // Mock handleMessage to return a promise
    mockHandleMessage.mockResolvedValueOnce('processed');

    await eventListener(mockEvent);

    expect(mockHandleMessage).toHaveBeenCalledWith(mockEvent);
  });
});
