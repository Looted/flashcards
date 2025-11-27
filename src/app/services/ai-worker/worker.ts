import { WorkerMessageHandler } from './worker-message-handler';

// Listen for messages from the main thread
self.addEventListener('message', async (event) => {
  await WorkerMessageHandler.handleMessage(event);
});
