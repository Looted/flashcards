// simple factory that a) references the worker file statically and b) creates the Worker
export function createAiWorker(): Worker {
  return new Worker(new URL('./worker.ts', import.meta.url), { type: 'module' });
}
